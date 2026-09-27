import fs from "node:fs/promises";
import path from "node:path";
import { AionChain } from "./aion-chain.js";

export async function saveChainSnapshot(chain, filePath) {
  const snapshot = {
    version: 1,
    totalSupplyNeuro: chain.totalSupplyNeuro.toString(),
    balances: Object.fromEntries([...chain.state.entries()].map(([a,b]) => [a,b.toString()])),
    nonces: Object.fromEntries(chain.nonces.entries()),
    blocks: chain.blocks
  };
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temp = filePath + ".tmp";
  await fs.writeFile(temp, JSON.stringify(snapshot, null, 2), "utf8");
  await fs.rename(temp, filePath);
  return filePath;
}

export async function loadChainSnapshot(filePath) {
  const snapshot = JSON.parse(await fs.readFile(filePath, "utf8"));
  if (snapshot.version !== 1) throw new Error("unsupported_snapshot_version");
  const chain = new AionChain({
    genesisBalances: snapshot.balances,
    genesisSupplyNeuro: BigInt(snapshot.totalSupplyNeuro)
  });
  chain.state = new Map(Object.entries(snapshot.balances).map(([a,b]) => [a, BigInt(b)]));
  chain.nonces = new Map(Object.entries(snapshot.nonces || {}).map(([a,b]) => [a, Number(b)]));
  chain.blocks = snapshot.blocks;
  return chain;
}
