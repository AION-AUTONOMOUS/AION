import { EventEmitter } from "node:events";
import crypto from "node:crypto";
import { sha256 } from "../protocol/aion-value-ledger.js";

export class AionPeerNetwork extends EventEmitter {
  constructor({ nodeId, maxPeers = 64 } = {}) {
    super();
    if (!nodeId) throw new TypeError("nodeId required");
    this.nodeId = nodeId;
    this.maxPeers = maxPeers;
    this.peers = new Map();
    this.seenMessages = new Set();
  }
  connect(peerId, transport) {
    if (!peerId || peerId === this.nodeId) throw new Error("invalid_peer");
    if (this.peers.size >= this.maxPeers && !this.peers.has(peerId)) throw new Error("peer_limit");
    this.peers.set(peerId, transport || null);
    this.emit("peer:connected", peerId);
  }
  disconnect(peerId) {
    const removed = this.peers.delete(peerId);
    if (removed) this.emit("peer:disconnected", peerId);
    return removed;
  }
  broadcast(type, payload) {
    const message = { version: 1, from: this.nodeId, type, payload, nonce: crypto.randomBytes(16).toString("hex") };
    message.messageId = sha256(message);
    this.seenMessages.add(message.messageId);
    for (const [peerId, transport] of this.peers) {
      if (transport?.send) transport.send(message);
      this.emit("message:sent", { peerId, message });
    }
    return message;
  }
  receive(message) {
    if (!message?.messageId || this.seenMessages.has(message.messageId)) return false;
    this.seenMessages.add(message.messageId);
    this.emit("message", message);
    return true;
  }
}
