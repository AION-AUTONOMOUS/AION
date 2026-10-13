import test from "node:test";
import assert from "node:assert/strict";
import { appendJournalRedis } from "../financial-core/redis-journal-store.js";

class FakeRedis {
  constructor() {
    this.values = new Map();
    this.versions = new Map();
    this.watched = new Map();
    this.conflictNextExec = false;
  }
  async watch(key) {
    this.watched.set(key, this.versions.get(key) ?? 0);
  }
  async get(key) {
    return this.values.get(key) ?? null;
  }
  async unwatch() {
    this.watched.clear();
  }
  multi() {
    const commands = [];
    const redis = this;
    const transaction = {
      set(key, value) {
        commands.push({ key, value });
        return transaction;
      },
      async exec() {
        if (redis.conflictNextExec) {
          redis.conflictNextExec = false;
          const first = commands[0];
          redis.versions.set(first.key, (redis.versions.get(first.key) ?? 0) + 1);
          redis.watched.clear();
          return null;
        }
        for (const { key } of commands) {
          if (redis.watched.get(key) !== (redis.versions.get(key) ?? 0)) {
            redis.watched.clear();
            return null;
          }
        }
        for (const { key, value } of commands) {
          redis.values.set(key, value);
          redis.versions.set(key, (redis.versions.get(key) ?? 0) + 1);
        }
        redis.watched.clear();
        return commands.map(() => "OK");
      }
    };
    return transaction;
  }
}

const command = (overrides = {}) => ({
  idempotencyKey: "order:00000001",
  currency: "USD",
  reference: "test-order-001",
  postings: [
    { accountId: "assets:cash", debitMinor: 1250, creditMinor: 0 },
    { accountId: "income:service", debitMinor: 0, creditMinor: 1250 }
  ],
  ...overrides
});

test("persists a balanced journal entry to Redis", async () => {
  const redis = new FakeRedis();
  const result = await appendJournalRedis(redis, "aion:journal:usd", command(), {
    now: "2026-10-10T00:00:00.000Z"
  });
  assert.equal(result.duplicate, false);
  assert.equal(result.state.entries.length, 1);
  assert.equal(JSON.parse(redis.values.get("aion:journal:usd")).entries.length, 1);
});

test("does not append a duplicate idempotent request twice", async () => {
  const redis = new FakeRedis();
  const first = await appendJournalRedis(redis, "aion:journal:usd", command());
  const second = await appendJournalRedis(redis, "aion:journal:usd", command());
  assert.equal(second.duplicate, true);
  assert.equal(second.entry.id, first.entry.id);
  assert.equal(JSON.parse(redis.values.get("aion:journal:usd")).entries.length, 1);
});

test("serializes concurrent calls that share a WATCH-based Redis client", async () => {
  const redis = new FakeRedis();
  const results = await Promise.all(
    Array.from({ length: 12 }, () => appendJournalRedis(redis, "aion:journal:usd", command()))
  );
  const stored = JSON.parse(redis.values.get("aion:journal:usd"));
  assert.equal(stored.entries.length, 1);
  assert.equal(results.filter(result => result.duplicate === false).length, 1);
  assert.equal(results.filter(result => result.duplicate === true).length, 11);
});

test("retries optimistic-lock conflicts", async () => {
  const redis = new FakeRedis();
  redis.conflictNextExec = true;
  const result = await appendJournalRedis(redis, "aion:journal:usd", command());
  assert.equal(result.attempts, 2);
  assert.equal(JSON.parse(redis.values.get("aion:journal:usd")).entries.length, 1);
});

test("rejects malformed stored journal data", async () => {
  const redis = new FakeRedis();
  redis.values.set("aion:journal:usd", "{not-json");
  await assert.rejects(
    appendJournalRedis(redis, "aion:journal:usd", command()),
    /not valid JSON/
  );
});

test("rejects a persisted journal whose hash chain was tampered with", async () => {
  const redis = new FakeRedis();
  const original = await appendJournalRedis(redis, "aion:journal:usd", command());
  const tampered = JSON.parse(redis.values.get("aion:journal:usd"));
  tampered.entries[0].postings[0].debitMinor = 999;
  redis.values.set("aion:journal:usd", JSON.stringify(tampered));

  await assert.rejects(
    appendJournalRedis(redis, "aion:journal:usd", command({
      idempotencyKey: "order:00000002",
      reference: "test-order-002"
    })),
    /integrity check failed/
  );
  assert.equal(original.state.entries.length, 1);
});

test("validates key and retry configuration", async () => {
  const redis = new FakeRedis();
  await assert.rejects(appendJournalRedis(redis, "bad", command()), /key is invalid/);
  await assert.rejects(
    appendJournalRedis(redis, "aion:journal:usd", command(), { maxRetries: 0 }),
    /maxRetries/
  );
});
