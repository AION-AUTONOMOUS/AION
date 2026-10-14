import { network } from "hardhat";

const treasuryNames = [
  "AION_FOUNDER_TREASURY",
  "AION_CHARITY_TREASURY",
  "AION_COMMUNITY_TREASURY",
  "AION_AI_REWARDS_TREASURY",
  "AION_DEVELOPMENT_TREASURY",
  "AION_DIGITAL_RESERVE",
  "AION_STRATEGIC_TREASURY",
];

const treasuries = treasuryNames.map((name) => {
  const address = process.env[name]?.trim();
  if (!address) throw new Error(`${name} is required`);
  return address;
});

const { ethers } = await network.connect();
for (let i = 0; i < treasuries.length; i += 1) {
  if (!ethers.isAddress(treasuries[i])) {
    throw new Error(`${treasuryNames[i]} must be a valid EVM address`);
  }
}
if (new Set(treasuries.map((address) => address.toLowerCase())).size !== treasuries.length) {
  throw new Error("All seven AION treasury addresses must be distinct");
}

const chain = await ethers.provider.getNetwork();
if (chain.chainId !== 97n) {
  throw new Error(`Refusing deployment: expected BNB Smart Chain Testnet (chain ID 97), got ${chain.chainId}`);
}

const token = await ethers.deployContract("AIONCoinV2", treasuries);
await token.waitForDeployment();

const address = await token.getAddress();
const totalSupply = await token.totalSupply();
if (totalSupply !== ethers.parseUnits("10000000000", 18)) {
  throw new Error(`Unexpected AION total supply: ${totalSupply}`);
}
if (await token.balanceOf(treasuries[1]) !== ethers.parseUnits("2500000000", 18)) {
  throw new Error("Unexpected charity allocation");
}

console.log(JSON.stringify({
  contract: "AIONCoinV2",
  address,
  network: "BNB Smart Chain Testnet",
  chainId: chain.chainId.toString(),
  symbol: await token.symbol(),
  totalSupply: ethers.formatUnits(totalSupply, 18),
  allocations: {
    founder: "6000000000",
    charity: "2500000000",
    community: "562500000",
    aiRewards: "375000000",
    development: "262500000",
    digitalReserve: "187500000",
    strategic: "112500000",
  },
  treasuries: Object.fromEntries(
    treasuryNames.map((name, index) => [name, treasuries[index]])
  ),
}, null, 2));
