import crypto from "node:crypto";
import { canonicalJson } from "../protocol/aion-value-ledger.js";

export function generateValidatorKey() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  return Object.freeze({
    publicKey: publicKey.export({ type: "spki", format: "pem" }),
    privateKey: privateKey.export({ type: "pkcs8", format: "pem" })
  });
}

export function signValidatorAttestation(attestation, privateKey) {
  return crypto.sign(null, Buffer.from(canonicalJson(stripSignature(attestation))), privateKey).toString("base64");
}

export function verifyValidatorAttestation(attestation, publicKey) {
  return Boolean(attestation?.signature && crypto.verify(
    null,
    Buffer.from(canonicalJson(stripSignature(attestation))),
    publicKey,
    Buffer.from(attestation.signature, "base64")
  ));
}

function stripSignature(value) {
  const { signature, ...unsigned } = value;
  return unsigned;
}
