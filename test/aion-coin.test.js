import { expect } from "chai";
import { network } from "hardhat";

describe("AIONCoinV2", function () {
  async function deployToken() {
    const { ethers } = await network.connect();
    const [founder, charity, community, rewards, development, reserve, strategic, recipient] =
      await ethers.getSigners();
    const token = await ethers.deployContract("AIONCoinV2", [
      founder.address,
      charity.address,
      community.address,
      rewards.address,
      development.address,
      reserve.address,
      strategic.address,
    ]);
    return { ethers, token, founder, charity, community, rewards, development, reserve, strategic, recipient };
  }

  it("mints the fixed 10 billion supply with 60% founder, 25% charity, and 15% proportional pools", async function () {
    const { ethers, token, founder, charity, community, rewards, development, reserve, strategic } =
      await deployToken();

    expect(await token.totalSupply()).to.equal(ethers.parseUnits("10000000000", 18));
    expect(await token.balanceOf(founder.address)).to.equal(ethers.parseUnits("6000000000", 18));
    expect(await token.balanceOf(charity.address)).to.equal(ethers.parseUnits("2500000000", 18));
    expect(await token.balanceOf(community.address)).to.equal(ethers.parseUnits("562500000", 18));
    expect(await token.balanceOf(rewards.address)).to.equal(ethers.parseUnits("375000000", 18));
    expect(await token.balanceOf(development.address)).to.equal(ethers.parseUnits("262500000", 18));
    expect(await token.balanceOf(reserve.address)).to.equal(ethers.parseUnits("187500000", 18));
    expect(await token.balanceOf(strategic.address)).to.equal(ethers.parseUnits("112500000", 18));
    expect(await token.charityTreasury()).to.equal(charity.address);
  });

  it("rejects a zero charity treasury", async function () {
    const { ethers } = await network.connect();
    const [founder, community, rewards, development, reserve, strategic] = await ethers.getSigners();
    await expect(ethers.deployContract("AIONCoinV2", [
      founder.address,
      ethers.ZeroAddress,
      community.address,
      rewards.address,
      development.address,
      reserve.address,
      strategic.address,
    ])).to.be.revertedWith("AION: zero charity");
  });

  it("transfers tokens without a transfer tax or supply burn", async function () {
    const { ethers, token, founder, recipient } = await deployToken();
    const amount = ethers.parseUnits("1000", 18);
    await token.transfer(recipient.address, amount);

    expect(await token.balanceOf(recipient.address)).to.equal(amount);
    expect(await token.totalSupply()).to.equal(ethers.parseUnits("10000000000", 18));
    expect(await token.balanceOf(founder.address)).to.equal(ethers.parseUnits("5999999000", 18));
  });
});
