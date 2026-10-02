
import test from "node:test";
import assert from "node:assert/strict";
import { createAttestation, finalizeBlock, quorumRequired } from "./aion-consensus.js";
import { generateValidatorKey, signValidatorAttestation, verifyValidatorAttestation } from "./aion-validator-crypto.js";

test("real validator quorum uses 2/3",()=>assert.equal(quorumRequired(3),2));
test("real Ed25519 attestation verifies and rejects tampering",()=>{
 const a=generateValidatorKey(), b=generateValidatorKey();
 const block={height:1,previousHash:"0".repeat(64),stateRoot:"1".repeat(64),txHashes:[],proposer:"v1",timestamp:"2026-09-27T00:00:00Z",blockHash:"b".repeat(64)};
 const unsigned={validatorId:"v1",blockHash:block.blockHash,proposalDigest:"d".repeat(64)};
 const att=createAttestation({validatorId:"v1",block,signature:signValidatorAttestation(unsigned,a.privateKey)});
 assert.equal(verifyValidatorAttestation(att,a.publicKey),true);
 assert.equal(verifyValidatorAttestation({...att,blockHash:"x".repeat(64)},a.publicKey),false);
});
