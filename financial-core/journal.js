import { createHash, randomUUID } from "node:crypto";

const CURRENCY = /^[A-Z]{3,12}$/;
const ACCOUNT = /^[A-Za-z0-9][A-Za-z0-9:_-]{1,127}$/;

function sha256(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function assertText(value, label, pattern) {
  if (typeof value !== "string" || !pattern.test(value)) {
    throw new TypeError(label + " is invalid");
  }
}

export function createJournalState() {
  return { schema: "aion.journal-state/0.1", entries: [], idempotency: {}, audit: [] };
}

/**
 * Append a balanced, integer-minor-unit journal transaction.
 * This is a deterministic domain core, not a database, custody system, or payment rail.
 * Persist state transactionally and enforce authorization in the service layer before production use.
 */
export function postJournal(state, command, { now = new Date().toISOString() } = {}) {
  if (!state || state.schema !== "aion.journal-state/0.1" ||
      !Array.isArray(state.entries) || !state.idempotency || !Array.isArray(state.audit)) {
    throw new TypeError("journal state is invalid");
  }
  if (!command || typeof command !== "object") throw new TypeError("command is required");
  assertText(command.idempotencyKey, "idempotencyKey", /^[A-Za-z0-9:_-]{8,160}$/);
  assertText(command.currency, "currency", CURRENCY);
  if (typeof command.reference !== "string" || command.reference.length < 1 || command.reference.length > 200) {
    throw new TypeError("reference is invalid");
  }
  if (!Array.isArray(command.postings) || command.postings.length < 2 || command.postings.length > 100) {
    throw new TypeError("postings must contain between 2 and 100 lines");
  }

  const normalized = command.postings.map((p) => {
    if (!p || typeof p !== "object") throw new TypeError("posting is invalid");
    assertText(p.accountId, "accountId", ACCOUNT);
    if (!Number.isSafeInteger(p.debitMinor) || p.debitMinor < 0 ||
        !Number.isSafeInteger(p.creditMinor) || p.creditMinor < 0) {
      throw new TypeError("debitMinor and creditMinor must be non-negative safe integers");
    }
    if ((p.debitMinor === 0) === (p.creditMinor === 0)) {
      throw new TypeError("each posting must have exactly one positive debit or credit");
    }
    return { accountId: p.accountId, debitMinor: p.debitMinor, creditMinor: p.creditMinor };
  });

  const debit = normalized.reduce((n, p) => n + BigInt(p.debitMinor), 0n);
  const credit = normalized.reduce((n, p) => n + BigInt(p.creditMinor), 0n);
  if (debit === 0n || debit !== credit) throw new Error("journal is not balanced");

  const fingerprint = sha256({ currency: command.currency, reference: command.reference, postings: normalized });
  const prior = state.idempotency[command.idempotencyKey];
  if (prior) {
    if (prior.fingerprint !== fingerprint) throw new Error("idempotency key reused with different command");
    return { state, entry: state.entries.find((e) => e.id === prior.entryId), duplicate: true };
  }

  const entryBody = {
    id: randomUUID(),
    schema: "aion.journal-entry/0.1",
    currency: command.currency,
    reference: command.reference,
    idempotencyKey: command.idempotencyKey,
    postings: normalized,
    totalMinor: debit.toString(),
    createdAt: now,
    previousHash: state.entries.at(-1)?.entryHash ?? null
  };
  const entry = Object.freeze({ ...entryBody, entryHash: sha256(entryBody) });
  const next = {
    schema: state.schema,
    entries: [...state.entries, entry],
    idempotency: { ...state.idempotency, [command.idempotencyKey]: { fingerprint, entryId: entry.id } },
    audit: [...state.audit, {
      event: "journal.posted",
      entryId: entry.id,
      entryHash: entry.entryHash,
      createdAt: now
    }]
  };
  return { state: next, entry, duplicate: false };
}

export function verifyJournalChain(state) {
  if (!state || !Array.isArray(state.entries)) return { valid: false, reason: "invalid state" };
  let previousHash = null;
  for (const entry of state.entries) {
    const { entryHash, ...body } = entry;
    if (body.previousHash !== previousHash || sha256(body) !== entryHash) {
      return { valid: false, reason: "chain hash mismatch", entryId: entry.id };
    }
    const debit = body.postings.reduce((n, p) => n + BigInt(p.debitMinor), 0n);
    const credit = body.postings.reduce((n, p) => n + BigInt(p.creditMinor), 0n);
    if (debit === 0n || debit !== credit) {
      return { valid: false, reason: "unbalanced entry", entryId: entry.id };
    }
    previousHash = entryHash;
  }
  return { valid: true, entriesVerified: state.entries.length };
}
