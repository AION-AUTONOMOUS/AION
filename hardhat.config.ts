import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatEthersChaiMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";

// Normalize harmless formatting differences in the Actions secret without ever logging it.
const rawDeployerKey = process.env.DEPLOYER_PRIVATE_KEY
  ?.trim()
  .replace(/^["']|["']$/g, "");
const normalizedDeployerKey = rawDeployerKey
  ? (rawDeployerKey.startsWith("0x") ? rawDeployerKey : `0x${rawDeployerKey}`)
  : undefined;

if (normalizedDeployerKey && !/^0x[0-9a-fA-F]{64}$/.test(normalizedDeployerKey)) {
  throw new Error(
    "DEPLOYER_PRIVATE_KEY must be exactly 32 bytes of hexadecimal (64 hex characters), optionally prefixed with 0x. Check the GitHub Actions secret; do not paste it into logs or chat."
  );
}

const deployerAccounts = normalizedDeployerKey ? [normalizedDeployerKey] : [];

export default defineConfig({
  plugins: [
    hardhatEthers,
    hardhatMocha,
    hardhatEthersChaiMatchers,
  ],
  solidity: {
    version: "0.8.20",
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    bscTestnet: {
      type: "http",
      chainType: "l1",
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      accounts: deployerAccounts,
      chainId: 97,
    },
    bsc: {
      type: "http",
      chainType: "l1",
      url: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 56,
    },
  },
});