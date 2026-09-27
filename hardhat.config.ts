import { defineConfig } from "hardhat/config";
import hardhatEthersChaiMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";

export default defineConfig({
  plugins: [hardhatMocha, hardhatEthersChaiMatchers],
  solidity: {
    version: "0.8.20",
  },
});
