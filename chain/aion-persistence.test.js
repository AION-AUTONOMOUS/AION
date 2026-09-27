import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { AionChain, generateWallet, makeTransaction } from "./aion-chain.js";
import { saveChainSnapshot, loadChainSnapshot } from "./aion-persistence.js";

test("chain state survives snapshot and restore", async () => {
  const alice = generateWallet();
  const bob = generateWallet();
  const chain = new AionChain({
    genesisBalances: { [alice.address]: 1000n },
    genesisSupplyNeuro: 1000n
  });
  const tx = makeTransaction({
    sender: alice.address,
    recipient: bob.address,
    amountNeuro: 300n,
    nonce: 0
  }, alice.privateKey);
  chain.commitBlock([tx], "validator-1", "2026-09-27T00:00:01.000Z", new Map([[alice.address, alice.publicKey]]));
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aion-"));
  const file = path.join(dir, "chain.json");
  await saveChainSnapshot(chain, file);
  const restored = await loadChainSnapshot(file);
  assert.equal(restored.balance(alice.address), 699n);
  assert.equal(restored.balance(bob.address), 300n);
  assert.equal(restored.nonce(alice.address), 1);
  assert.equal(restored.latestBlock().blockHash, chain.latestBlock().blockHash);
  await fs.rm(dir, { recursive: true, force: true });
});
