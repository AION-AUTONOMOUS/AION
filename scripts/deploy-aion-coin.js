import { network } from "hardhat";

const treasuryNames = [
  "AION_CHARITY_TREASURY",
  "AION_FOUNDER_TREASURY",
  "AION_DEVELOPMENT_TREASURY",
  "AION_COMMUNITY_TREASURY",
  "AION_DIGITAL_RESERVE",
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
  throw new Error("All five AION treasury addresses must be distinct");
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

const expected = [
  ["charity", "2500000000", await token.CHARITY_ALLOCATION()],
  ["founder", "6000000000", await token.FOUNDER_ALLOCATION()],
  ["development", "500000000", await token.DEVELOPMENT_ALLOCATION()],
  ["community", "500000000", await token.COMMUNITY_ALLOCATION()],
  ["digitalReserve", "500000000", await token.DIGITAL_RESERVE_ALLOCATION()],
];
for (const [name, amount, actual] of expected) {
  if (actual !== ethers.parseUnits(amount, 18)) {
    throw new Error(`Unexpected ${name} allocation: ${actual}`);
  }
}

console.log(JSON.stringify({
  contract: "AIONCoinV2",
  address,
  network: "BNB Smart Chain Testnet",
  chainId: chain.chainId.toString(),
  symbol: await token.symbol(),
  totalSupply: ethers.formatUnits(totalSupply, 18),
  allocations: Object.fromEntries(expected.map(([name, amount]) => [name, amount])),
  treasuries: Object.fromEntries(treasuryNames.map((name, index) => [name, treasuries[index]])),
}, null, 2));
