import test from "node:test";
import assert from "node:assert/strict";
import { AionPeerNetwork } from "./aion-p2p.js";

test("peer network enforces identity and peer limits", () => {
  const net = new AionPeerNetwork({ nodeId: "node-a", maxPeers: 1 });
  net.connect("node-b");
  assert.throws(() => net.connect("node-a"), /invalid_peer/);
  assert.throws(() => net.connect("node-c"), /peer_limit/);
});

test("duplicate gossip messages are ignored", () => {
  const net = new AionPeerNetwork({ nodeId: "node-a" });
  let count = 0;
  net.on("message", () => count++);
  const message = { messageId: "m1", type: "tx", payload: { txHash: "x" } };
  assert.equal(net.receive(message), true);
  assert.equal(net.receive(message), false);
  assert.equal(count, 1);
});
