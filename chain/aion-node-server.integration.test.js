import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { generateWallet, makeTransaction } from "./aion-chain.js";
import { generateValidatorKey, signValidatorAttestation } from "./aion-validator-crypto.js";
import { createAttestation, proposalDigest } from "./aion-consensus.js";

const port = 18987;
const base = `http://127.0.0.1:${port}`;

async function waitForHealth(proc) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) throw new Error("validator node exited early");
    try {
      const r = await fetch(base + "/health");
      if (r.ok) return r.json();
    } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error("validator node health timeout");
}

async function post(path, body) {
  const r = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return { status: r.status, body: await r.json() };
}

test("validator node completes transaction -> proposal -> 2/3 quorum -> commit", async t => {
  const validators = [generateValidatorKey(), generateValidatorKey(), generateValidatorKey()];
  const ids = ["validator-a", "validator-b", "validator-c"];
  const validatorSet = Object.fromEntries(ids.map((id, i) => [id, validators[i].publicKey]));
  const wallet = generateWallet();
  const stateFile = "/tmp/aion-validator-node-integration-" + process.pid + ".json";

  const proc = spawn(process.execPath, ["chain/aion-node-server.js"], {
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ID: ids[0],
      VALIDATOR_SET: JSON.stringify(validatorSet),
      VALIDATOR_PRIVATE_KEY: validators[0].privateKey,
      VALIDATOR_PUBLIC_KEY: validators[0].publicKey,
      AION_GENESIS_BALANCES: JSON.stringify({ [wallet.address]: "100" }),
      AION_STATE_FILE: stateFile,
      PEER_URLS: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  t.after(async () => {
    proc.kill("SIGTERM");
    await rm(stateFile, { force: true }).catch(() => {});
  });

  await waitForHealth(proc);

  const tx = makeTransaction({
    sender: wallet.address,
    recipient: "aion1recipient",
    amountNeuro: 10,
    feeNeuro: 1,
    nonce: 0
  }, wallet.privateKey);

  const accepted = await post("/rpc/transaction", { transaction: tx, publicKey: wallet.publicKey });
  assert.equal(accepted.status, 202);

  const proposed = await post("/rpc/propose", {});
  assert.equal(proposed.status, 200);
  const block = proposed.body.block;
  const leaderAtt = proposed.body.attestations[0];

  const secondUnsigned = {
    validatorId: ids[1],
    blockHash: block.blockHash,
    proposalDigest: proposalDigest(block)
  };
  const secondAtt = createAttestation({
    ...secondUnsigned,
    signature: signValidatorAttestation(secondUnsigned, validators[1].privateKey)
  });

  const committed = await post("/rpc/commit", {
    block,
    transactions: [tx],
    attestations: [leaderAtt, secondAtt],
    publicKeys: { [wallet.address]: wallet.publicKey }
  });

  assert.equal(committed.status, 200);
  assert.equal(committed.body.finalized, true);
  assert.equal(committed.body.height, 1);

  const status = await fetch(base + "/rpc/status").then(r => r.json());
  assert.equal(status.height, 1);
  assert.equal(status.mempool, 0);
});
