import { expect } from "chai";
import { network } from "hardhat";

describe("AIONCoinV2", function () {
  async function deployToken() {
    const { ethers } = await network.connect();
    const [founder, community, rewards, development, reserve, strategic, recipient] =
      await ethers.getSigners();
    const token = await ethers.deployContract("AIONCoinV2", [
      founder.address,
      community.address,
      rewards.address,
      development.address,
      reserve.address,
      strategic.address,
    ]);
    return { ethers, token, founder, community, rewards, development, reserve, strategic, recipient };
  }

  it("mints the fixed 10 billion supply across the six treasury allocations", async function () {
    const { ethers, token, founder, community, rewards, development, reserve, strategic } =
      await deployToken();

    expect(await token.totalSupply()).to.equal(ethers.parseUnits("10000000000", 18));
    expect(await token.balanceOf(founder.address)).to.equal(ethers.parseUnits("6000000000", 18));
    expect(await token.balanceOf(community.address)).to.equal(ethers.parseUnits("1500000000", 18));
    expect(await token.balanceOf(rewards.address)).to.equal(ethers.parseUnits("1000000000", 18));
    expect(await token.balanceOf(development.address)).to.equal(ethers.parseUnits("700000000", 18));
    expect(await token.balanceOf(reserve.address)).to.equal(ethers.parseUnits("500000000", 18));
    expect(await token.balanceOf(strategic.address)).to.equal(ethers.parseUnits("300000000", 18));
  });

  it("transfers tokens without a transfer tax or supply burn", async function () {
    const { ethers, token, founder, recipient } = await deployToken();
    const amount = ethers.parseUnits("1000", 18);
    await token.transfer(recipient.address, amount);

    expect(await token.balanceOf(recipient.address)).to.equal(amount);
    expect(await token.totalSupply()).to.equal(ethers.parseUnits("10000000000", 18));
    expect(await token.balanceOf(founder.address)).to.equal(
      ethers.parseUnits("6000000000", 18).sub
        ? ethers.parseUnits("6000000000", 18) - amount
        : ethers.parseUnits("5999999000", 18)
    );
  });
});
