const keyOf = (entry) => {
  if (!entry || typeof entry !== "object") throw new TypeError("statement entry must be an object");
  for (const field of ["reference", "amountMinor", "currency"]) {
    if (entry[field] === undefined || entry[field] === null || entry[field] === "") {
      throw new TypeError("statement entry " + field + " is required");
    }
  }
  if (typeof entry.reference !== "string") throw new TypeError("statement entry reference must be a string");
  if (!Number.isSafeInteger(entry.amountMinor) || entry.amountMinor < 0) {
    throw new TypeError("statement entry amountMinor must be a non-negative safe integer");
  }
  if (typeof entry.currency !== "string" || !/^[A-Z]{3}$/.test(entry.currency)) {
    throw new TypeError("statement entry currency must be an uppercase ISO-style code");
  }
  return entry.reference;
};

/**
 * Compare internal posted records with an external provider/bank statement.
 * Any discrepancy blocks settlement. This function does not move money.
 */
export function reconcileStatements({ internalEntries, externalEntries } = {}) {
  if (!Array.isArray(internalEntries) || !Array.isArray(externalEntries)) {
    throw new TypeError("internalEntries and externalEntries must be arrays");
  }

  const internal = new Map();
  const external = new Map();
  for (const entry of internalEntries) {
    const key = keyOf(entry);
    if (internal.has(key)) throw new Error("duplicate internal reference: " + key);
    internal.set(key, entry);
  }
  for (const entry of externalEntries) {
    const key = keyOf(entry);
    if (external.has(key)) throw new Error("duplicate external reference: " + key);
    external.set(key, entry);
  }

  const discrepancies = [];
  for (const [reference, entry] of internal) {
    const counterpart = external.get(reference);
    if (!counterpart) {
      discrepancies.push({ reference, type: "missing_external" });
      continue;
    }
    if (entry.amountMinor !== counterpart.amountMinor ||
        entry.currency !== counterpart.currency) {
      discrepancies.push({
        reference,
        type: "amount_or_currency_mismatch",
        internal: { amountMinor: entry.amountMinor, currency: entry.currency },
        external: { amountMinor: counterpart.amountMinor, currency: counterpart.currency }
      });
    }
  }
  for (const reference of external.keys()) {
    if (!internal.has(reference)) discrepancies.push({ reference, type: "missing_internal" });
  }

  discrepancies.sort((a, b) => a.reference.localeCompare(b.reference) || a.type.localeCompare(b.type));
  return {
    status: discrepancies.length === 0 ? "matched" : "blocked",
    settlementAllowed: discrepancies.length === 0,
    internalCount: internal.size,
    externalCount: external.size,
    discrepancies
  };
}
