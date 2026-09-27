import crypto from "node:crypto";
import { PROTOCOL, canonicalJson, sha256 } from "../protocol/aion-value-ledger.js";

export const CHAIN = Object.freeze({
  name: "AION Chain Simulator",
  version: "0.2.0",
  maxSupplyNeuro: PROTOCOL.maxSupplyNeuro,
  minFeeNeuro: 1n
});

export function generateWallet() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" });
  return Object.freeze({
    address: "aion1" + sha256(publicKeyPem).slice(0, 40),
    publicKey: publicKeyPem,
    privateKey: privateKeyPem
  });
}

export function signTransaction(tx, privateKeyPem) {
  const payload = canonicalJson(stripSignature(tx));
  return crypto.sign(null, Buffer.from(payload), privateKeyPem).toString("base64");
}

export function verifyTransaction(tx, publicKeyPem) {
  if (!tx?.signature) return false;
  return crypto.verify(
    null,
    Buffer.from(canonicalJson(stripSignature(tx))),
    publicKeyPem,
    Buffer.from(tx.signature, "base64")
  );
}

export function makeTransaction({ sender, recipient, amountNeuro, feeNeuro = CHAIN.minFeeNeuro, nonce, payload = {} }, privateKeyPem) {
  if (!sender || !recipient) throw new TypeError("sender and recipient required");
  if (BigInt(amountNeuro) <= 0n) throw new RangeError("amount must be positive");
  if (BigInt(feeNeuro) < CHAIN.minFeeNeuro) throw new RangeError("fee below minimum");
  const tx = {
    version: 1,
    sender,
    recipient,
    amountNeuro: String(BigInt(amountNeuro)),
    feeNeuro: String(BigInt(feeNeuro)),
    nonce: Number(nonce),
    payload
  };
  return Object.freeze({ ...tx, signature: signTransaction(tx, privateKeyPem), txHash: sha256(tx) });
}

export class AionChain {
  constructor({ genesisBalances = {}, genesisSupplyNeuro = null } = {}) {
    this.state = new Map(Object.entries(genesisBalances).map(([a,b]) => [a, BigInt(b)]));
    this.nonces = new Map();
    this.blocks = [];
    const computed = [...this.state.values()].reduce((a,b)=>a+b,0n);
    this.totalSupplyNeuro = genesisSupplyNeuro === null ? computed : BigInt(genesisSupplyNeuro);
    if (this.totalSupplyNeuro < computed || this.totalSupplyNeuro > CHAIN.maxSupplyNeuro) {
      throw new RangeError("invalid genesis supply");
    }
    this.blocks.push(this._makeBlock([], "genesis-proposer", "2026-09-27T00:00:00.000Z"));
  }

  balance(address) { return this.state.get(address) || 0n; }
  nonce(address) { return this.nonces.get(address) || 0; }
  latestBlock() { return this.blocks[this.blocks.length - 1]; }

  applyTransaction(tx, publicKeyPem) {
    if (!verifyTransaction(tx, publicKeyPem)) throw new Error("invalid_signature");
    if (sha256(stripSignature(tx)) !== tx.txHash) throw new Error("invalid_tx_hash");
    const expectedNonce = this.nonce(tx.sender);
    if (tx.nonce !== expectedNonce) throw new Error("invalid_nonce");
    const amount = BigInt(tx.amountNeuro);
    const fee = BigInt(tx.feeNeuro);
    const total = amount + fee;
    if (this.balance(tx.sender) < total) throw new Error("insufficient_balance");

    this.state.set(tx.sender, this.balance(tx.sender) - total);
    this.state.set(tx.recipient, this.balance(tx.recipient) + amount);
    this.nonces.set(tx.sender, expectedNonce + 1);
    return Object.freeze({ txHash: tx.txHash, amountNeuro: amount, feeNeuro: fee });
  }

  commitBlock(transactions, proposer, timestamp = new Date().toISOString(), publicKeys = new Map()) {
    const applied = [];
    for (const tx of transactions) {
      applied.push(this.applyTransaction(tx, publicKeys.get(tx.sender)));
    }
    const stateRoot = sha256({
      balances: [...this.state.entries()].sort(),
      nonces: [...this.nonces.entries()].sort()
    });
    const previousHash = this.latestBlock().blockHash;
    const block = this._makeBlock(transactions, proposer, timestamp, previousHash, stateRoot);
    this.blocks.push(block);
    return block;
  }

  _makeBlock(transactions, proposer, timestamp, previousHash = "0".repeat(64), stateRoot = sha256({})) {
    const header = {
      version: 1,
      height: this.blocks.length,
      previousHash,
      timestamp,
      proposer,
      txHashes: transactions.map(t=>t.txHash),
      stateRoot
    };
    return Object.freeze({ ...header, blockHash: sha256(header) });
  }
}

function stripSignature(tx) {
  const { signature, txHash, ...unsigned } = tx;
  return unsigned;
}
