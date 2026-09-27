import test from "node:test";
import assert from "node:assert/strict";
import { generateValidatorKey, signValidatorAttestation, verifyValidatorAttestation } from "./aion-validator-crypto.js";

test("validator attestations use Ed25519 signatures", () => {
  const key = generateValidatorKey();
  const attestation = { validatorId: "v1", blockHash: "abc", signature: null };
  const signed = { ...attestation, signature: signValidatorAttestation(attestation, key.privateKey) };
  assert.equal(verifyValidatorAttestation(signed, key.publicKey), true);
  assert.equal(verifyValidatorAttestation({ ...signed, blockHash: "tampered" }, key.publicKey), false);
});
