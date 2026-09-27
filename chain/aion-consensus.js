import { sha256 } from "../protocol/aion-value-ledger.js";

export const CONSENSUS = Object.freeze({
  name: "AION Byzantine Quorum Finality",
  version: "0.3.0",
  quorumNumerator: 2n,
  quorumDenominator: 3n
});

export function quorumRequired(validatorCount) {
  const n = BigInt(validatorCount);
  if (n < 1n) throw new RangeError("validator set cannot be empty");
  return Number((n * CONSENSUS.quorumNumerator + (CONSENSUS.quorumDenominator - 1n)) / CONSENSUS.quorumDenominator);
}

export function proposalDigest(block) {
  return sha256({
    height: block.height,
    previousHash: block.previousHash,
    stateRoot: block.stateRoot,
    txHashes: block.txHashes,
    proposer: block.proposer,
    timestamp: block.timestamp
  });
}

export function createAttestation({ validatorId, block, signature }) {
  if (!validatorId || !signature) throw new TypeError("validatorId and signature required");
  return Object.freeze({
    validatorId,
    blockHash: block.blockHash,
    proposalDigest: proposalDigest(block),
    signature
  });
}

export function finalizeBlock(block, validatorSet, attestations) {
  const allowed = new Set(validatorSet);
  const seen = new Set();
  const accepted = [];
  for (const a of attestations || []) {
    if (!allowed.has(a.validatorId) || seen.has(a.validatorId)) continue;
    if (a.blockHash !== block.blockHash || a.proposalDigest !== proposalDigest(block)) continue;
    seen.add(a.validatorId);
    accepted.push(a);
  }
  const required = quorumRequired(validatorSet.length);
  return Object.freeze({
    finalized: accepted.length >= required,
    required,
    attestations: accepted,
    certificateHash: accepted.length >= required ? sha256(accepted.map(a => ({
      validatorId: a.validatorId,
      blockHash: a.blockHash,
      proposalDigest: a.proposalDigest
    })).sort((a,b)=>a.validatorId.localeCompare(b.validatorId))) : null
  });
}
