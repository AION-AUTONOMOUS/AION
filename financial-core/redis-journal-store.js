import { createJournalState, postJournal } from "./journal.js";

const KEY_PATTERN = /^[A-Za-z0-9:_-]{8,200}$/;

/**
 * Append a journal command to one Redis key using WATCH/MULTI optimistic locking.
 *
 * This adapter is an early persistence boundary, not a production ledger by itself:
 * callers must provide a dedicated Redis client, enforce authorization, configure durable
 * Redis persistence/backup, and monitor failures. Do not set a TTL on the journal key.
 */
export async function appendJournalRedis(client, key, command, {
  now,
  maxRetries = 5
} = {}) {
  if (!client || typeof client.watch !== "function" || typeof client.get !== "function" ||
      typeof client.multi !== "function" || typeof client.unwatch !== "function") {
    throw new TypeError("a compatible Redis client is required");
  }
  if (typeof key !== "string" || !KEY_PATTERN.test(key)) {
    throw new TypeError("journal Redis key is invalid");
  }
  if (!Number.isSafeInteger(maxRetries) || maxRetries < 1 || maxRetries > 25) {
    throw new TypeError("maxRetries must be an integer between 1 and 25");
  }

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    await client.watch(key);
    try {
      const raw = await client.get(key);
      let state;
      if (raw === null) {
        state = createJournalState();
      } else {
        try {
          state = JSON.parse(raw);
        } catch {
          throw new Error("stored journal state is not valid JSON");
        }
        if (!state || state.schema !== "aion.journal-state/0.1" ||
            !Array.isArray(state.entries) || !state.idempotency || !Array.isArray(state.audit)) {
          throw new Error("stored journal state has an unsupported schema");
        }
      }

      const posted = postJournal(state, command, now === undefined ? undefined : { now });
      if (posted.duplicate) {
        await client.unwatch();
        return { ...posted, attempts: attempt };
      }

      const transaction = client.multi();
      transaction.set(key, JSON.stringify(posted.state));
      const result = await transaction.exec();
      if (result !== null) {
        return { ...posted, attempts: attempt };
      }
    } catch (error) {
      try {
        await client.unwatch();
      } catch {
        // Preserve the original operation error.
      }
      throw error;
    }
  }

  throw new Error("journal write conflicted too many times; retry the request");
}
