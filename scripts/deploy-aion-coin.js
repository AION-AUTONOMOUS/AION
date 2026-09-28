import { ethers } from "hardhat";

const owner = process.env.AION_COIN_OWNER;
if (!owner) throw new Error("AION_COIN_OWNER is required");

const token = await ethers.deployContract("AIONCoin", [owner]);
await token.waitForDeployment();

console.log(JSON.stringify({
  contract: "AIONCoin",
  address: await token.getAddress(),
  owner,
  network: (await ethers.provider.getNetwork()).chainId.toString(),
  totalSupply: (await token.totalSupply()).toString()
}, null, 2));