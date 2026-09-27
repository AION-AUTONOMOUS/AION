import { defineConfig } from "hardhat/config";
import hardhatEthersChaiMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";

export default defineConfig({
  plugins: [hardhatEthersChaiMatchers],
  solidity: {
    version: "0.8.20",
  },
});
