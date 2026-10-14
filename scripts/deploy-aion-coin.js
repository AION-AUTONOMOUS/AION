import { network } from "hardhat";

const treasuryNames = [
  "AION_FOUNDER_TREASURY",
  "AION_CHARITY_TREASURY",
  "AION_OPERATIONS_TREASURY",
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
  throw new Error("All three AION treasury addresses must be distinct");
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

const expectedAllocations = [
  ["founder", await token.FOUNDER_ALLOCATION()],
  ["charity", await token.CHARITY_ALLOCATION()],
  ["operations", await token.OPERATIONS_ALLOCATION()],
];
const allocationSum = expectedAllocations.reduce((sum, [, amount]) => sum + amount, 0n);
if (allocationSum !== totalSupply) {
  throw new Error("Treasury allocations do not equal total supply");
}

console.log(JSON.stringify({
  contract: "AIONCoinV2",
  address,
  network: "BNB Smart Chain Testnet",
  chainId: chain.chainId.toString(),
  symbol: await token.symbol(),
  totalSupply: ethers.formatUnits(totalSupply, 18),
  allocations: Object.fromEntries(
    expectedAllocations.map(([name, amount]) => [name, ethers.formatUnits(amount, 18)])
  ),
  treasuries: Object.fromEntries(treasuryNames.map((name, index) => [name, treasuries[index]])),
}, null, 2));
