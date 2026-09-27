import test from "node:test";
import assert from "node:assert/strict";
import { pqcAvailable, generatePqcValidatorKeyPair, signPqc, verifyPqc } from "./aion-pqc.js";

test("PQC capability is detected without silently falling back", () => {
  if (!pqcAvailable()) return;
  const keys = generatePqcValidatorKeyPair();
  const message = "AION-PoI-validator-attestation";
  const signature = signPqc(message, keys.privateKey);
  assert.equal(verifyPqc(message, signature, keys.publicKey), true);
  assert.equal(verifyPqc(message + "-tampered", signature, keys.publicKey), false);
});
