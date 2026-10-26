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
const networkDetails = {
  97: { name: "BNB Smart Chain Testnet", environment: "testnet" },
  56: { name: "BNB Smart Chain Mainnet", environment: "mainnet" },
};
const selectedNetwork = networkDetails[Number(chain.chainId)];

if (!selectedNetwork) {
  throw new Error(
    `Refusing deployment: unsupported chain ID ${chain.chainId}; expected 97 (testnet) or 56 (mainnet)`
  );
}
if (
  selectedNetwork.environment === "mainnet" &&
  process.env.AION_ALLOW_MAINNET_DEPLOYMENT !== "true"
) {
  throw new Error(
    "Mainnet deployment is disabled by default. Set AION_ALLOW_MAINNET_DEPLOYMENT=true only after verifying the contract, all five treasury addresses, and deployer funding."
  );
}

const token = await ethers.deployContract("AIONCoinV2", treasuries);
await token.waitForDeployment();

const address = await token.getAddress();
const deploymentTransaction = token.deploymentTransaction();
if (!deploymentTransaction?.hash) {
  throw new Error("Deployment transaction hash is unavailable; refusing to report deployment as complete");
}
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
  transactionHash: deploymentTransaction.hash,
  explorerUrl: `https://testnet.bscscan.com/tx/${deploymentTransaction.hash}`,
  network: selectedNetwork.name,
  chainId: chain.chainId.toString(),
  symbol: await token.symbol(),
  totalSupply: ethers.formatUnits(totalSupply, 18),
  allocations: Object.fromEntries(expected.map(([name, amount]) => [name, amount])),
  treasuries: Object.fromEntries(treasuryNames.map((name, index) => [name, treasuries[index]])),
}, null, 2));
