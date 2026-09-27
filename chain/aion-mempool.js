import { sha256 } from "../protocol/aion-value-ledger.js";

function unsignedTx(tx) {
  const { signature, txHash, ...unsigned } = tx;
  return unsigned;
}
export class AionMempool {
  constructor({ maxTransactions = 10_000 } = {}) {
    this.maxTransactions = maxTransactions;
    this.byHash = new Map();
    this.bySenderNonce = new Map();
  }
  add(tx) {
    if (!tx?.txHash || !tx.sender || !Number.isInteger(tx.nonce)) throw new TypeError("invalid transaction");
    if (this.byHash.has(tx.txHash)) return { accepted: false, reason: "duplicate" };
    if (this.byHash.size >= this.maxTransactions) return { accepted: false, reason: "full" };
    const key = `${tx.sender}:${tx.nonce}`;
    if (this.bySenderNonce.has(key)) return { accepted: false, reason: "nonce_conflict" };
    const expectedHash = sha256(unsignedTx(tx));
    if (tx.expectedUnsignedHash && tx.expectedUnsignedHash !== expectedHash) return { accepted: false, reason: "invalid_hash" };
    this.byHash.set(tx.txHash, tx);
    this.bySenderNonce.set(key, tx.txHash);
    return { accepted: true, txHash: tx.txHash };
  }
  remove(txHash) {
    const tx = this.byHash.get(txHash);
    if (!tx) return false;
    this.byHash.delete(txHash);
    this.bySenderNonce.delete(`${tx.sender}:${tx.nonce}`);
    return true;
  }
  list({ limit = this.maxTransactions } = {}) {
    return [...this.byHash.values()].sort((a,b) => a.sender.localeCompare(b.sender) || a.nonce - b.nonce || a.txHash.localeCompare(b.txHash)).slice(0, limit);
  }
  size() { return this.byHash.size; }
}
