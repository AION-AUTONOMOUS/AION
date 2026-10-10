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
    return {
      set: (key, value) => { commands.push({ key, value }); return this; },
      exec: async () => {
        if (this.conflictNextExec) {
          this.conflictNextExec = false;
          const first = commands[0];
          this.versions.set(first.key, (this.versions.get(first.key) ?? 0) + 1);
          this.watched.clear();
          return null;
        }
        for (const { key } of commands) {
          if (this.watched.get(key) !== (this.versions.get(key) ?? 0)) {
            this.watched.clear();
            return null;
          }
        }
        for (const { key, value } of commands) {
          this.values.set(key, value);
          this.versions.set(key, (this.versions.get(key) ?? 0) + 1);
        }
        this.watched.clear();
        return commands.map(() => "OK");
      }
    };
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

test("validates key and retry configuration", async () => {
  const redis = new FakeRedis();
  await assert.rejects(appendJournalRedis(redis, "bad", command()), /key is invalid/);
  await assert.rejects(
    appendJournalRedis(redis, "aion:journal:usd", command(), { maxRetries: 0 }),
    /maxRetries/
  );
});
