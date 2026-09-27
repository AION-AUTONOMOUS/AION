import test from "node:test";
import assert from "node:assert/strict";
import { AionChain, CHAIN, generateWallet, makeTransaction } from "./aion-chain.js";

test("wallet addresses are deterministic identifiers derived from public keys", () => {
  const wallet = generateWallet();
  assert.match(wallet.address, /^aion1[a-f0-9]{40}$/);
});

test("signed transfers enforce balances, fees and nonces", () => {
  const alice = generateWallet();
  const bob = generateWallet();
  const chain = new AionChain({
    genesisBalances: { [alice.address]: 1_000n },
    genesisSupplyNeuro: 1_000n
  });

  const tx = makeTransaction({
    sender: alice.address,
    recipient: bob.address,
    amountNeuro: 250n,
    feeNeuro: CHAIN.minFeeNeuro,
    nonce: 0
  }, alice.privateKey);

  const block = chain.commitBlock([tx], "validator-1", "2026-09-27T00:00:01.000Z",
    new Map([[alice.address, alice.publicKey]]));

  assert.equal(chain.balance(alice.address), 749n);
  assert.equal(chain.balance(bob.address), 250n);
  assert.equal(chain.nonce(alice.address), 1);
  assert.equal(block.height, 1);
  assert.equal(chain.totalSupplyNeuro, 1_000n);
});

test("replay with the same nonce is rejected", () => {
  const alice = generateWallet();
  const bob = generateWallet();
  const chain = new AionChain({ genesisBalances: { [alice.address]: 500n }, genesisSupplyNeuro: 500n });
  const tx = makeTransaction({ sender: alice.address, recipient: bob.address, amountNeuro: 100n, nonce: 0 }, alice.privateKey);
  const keys = new Map([[alice.address, alice.publicKey]]);
  chain.commitBlock([tx], "validator-1", "2026-09-27T00:00:01.000Z", keys);
  assert.throws(() => chain.commitBlock([tx], "validator-1", "2026-09-27T00:00:02.000Z", keys), /invalid_nonce/);
});

test("genesis cannot exceed the protocol supply cap", () => {
  const wallet = generateWallet();
  assert.throws(() => new AionChain({
    genesisBalances: { [wallet.address]: CHAIN.maxSupplyNeuro + 1n },
    genesisSupplyNeuro: CHAIN.maxSupplyNeuro + 1n
  }), /invalid genesis supply/);
});


test("issuance cannot exceed the 10B AION hard cap", () => {
  const chain = new AionChain({ genesisBalances: { genesis: 1n }, genesisSupplyNeuro: 1n });
  const remaining = CHAIN.maxSupplyNeuro - chain.totalSupplyNeuro;
  chain.issueNeuro(remaining, "treasury");
  assert.equal(chain.totalSupplyNeuro, CHAIN.maxSupplyNeuro);
  assert.throws(() => chain.issueNeuro(1n, "treasury"), /max supply exceeded/);
});
