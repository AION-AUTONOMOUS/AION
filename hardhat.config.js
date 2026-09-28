import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers-chai-matchers";

export default defineConfig({
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    bscTestnet: {
      type: "http",
      url: process.env.BSC_TESTNET_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 97,
    },
    bsc: {
      type: "http",
      url: process.env.BSC_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 56,
    },
  },
});