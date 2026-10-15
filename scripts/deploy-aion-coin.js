import { network } from "hardhat";

const treasuryNames = [
  "AION_FOUNDER_TREASURY",
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
  throw new Error("All six AION treasury addresses must be distinct");
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
    "Mainnet deployment is disabled by default. Set AION_ALLOW_MAINNET_DEPLOYMENT=true only after reviewing treasury addresses and funding the deployer wallet for gas."
  );
}

const token = await ethers.deployContract("AIONCoinV2", treasuries);
await token.waitForDeployment();

const address = await token.getAddress();
const totalSupply = await token.totalSupply();
if (totalSupply !== ethers.parseUnits("10000000000", 18)) {
  throw new Error(`Unexpected AION total supply: ${totalSupply}`);
}

console.log(JSON.stringify({
  contract: "AIONCoinV2",
  address,
  network: selectedNetwork.name,
  chainId: chain.chainId.toString(),
  symbol: await token.symbol(),
  totalSupply: ethers.formatUnits(totalSupply, 18),
  treasuries: Object.fromEntries(
    treasuryNames.map((name, index) => [name, treasuries[index]])
  ),
}, null, 2));
