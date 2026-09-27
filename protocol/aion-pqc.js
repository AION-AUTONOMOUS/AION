import crypto from "node:crypto";

export const PQC = Object.freeze({
  algorithm: "ML-DSA-65",
  standard: "NIST FIPS 204",
  hybridPolicy: "ML-DSA-65 + Ed25519 during migration"
});

export function pqcAvailable() {
  try {
    crypto.generateKeyPairSync("ml-dsa-65");
    return true;
  } catch {
    return false;
  }
}

export function generatePqcValidatorKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ml-dsa-65", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });
  return { algorithm: PQC.algorithm, publicKey, privateKey };
}

export function signPqc(message, privateKey) {
  if (!pqcAvailable()) throw new Error("ML-DSA-65 is unavailable in this Node/OpenSSL runtime");
  return crypto.sign(null, Buffer.from(message), privateKey).toString("base64");
}

export function verifyPqc(message, signature, publicKey) {
  if (!pqcAvailable()) return false;
  return crypto.verify(null, Buffer.from(message), publicKey, Buffer.from(signature, "base64"));
}
