import { expect } from "chai";
import { network } from "hardhat";

describe("AIONCoinV2 approved tokenomics", function () {
  async function deployToken() {
    const { ethers } = await network.connect();
    const [charity, founder, development, community, reserve, recipient] =
      await ethers.getSigners();
    const treasuries = [
      charity.address,
      founder.address,
      development.address,
      community.address,
      reserve.address,
    ];
    const token = await ethers.deployContract("AIONCoinV2", treasuries);
    return { ethers, token, charity, founder, development, community, reserve, recipient, treasuries };
  }

  it("mints exactly 10 billion tokens in the approved 25/60/5/5/5 allocation", async function () {
    const { ethers, token, charity, founder, development, community, reserve } =
      await deployToken();

    expect(await token.totalSupply()).to.equal(ethers.parseUnits("10000000000", 18));
    expect(await token.balanceOf(charity.address)).to.equal(ethers.parseUnits("2500000000", 18));
    expect(await token.balanceOf(founder.address)).to.equal(ethers.parseUnits("6000000000", 18));
    expect(await token.balanceOf(development.address)).to.equal(ethers.parseUnits("500000000", 18));
    expect(await token.balanceOf(community.address)).to.equal(ethers.parseUnits("500000000", 18));
    expect(await token.balanceOf(reserve.address)).to.equal(ethers.parseUnits("500000000", 18));

    expect(await token.CHARITY_ALLOCATION()).to.equal(ethers.parseUnits("2500000000", 18));
    expect(await token.FOUNDER_ALLOCATION()).to.equal(ethers.parseUnits("6000000000", 18));
    expect(await token.DEVELOPMENT_ALLOCATION()).to.equal(ethers.parseUnits("500000000", 18));
    expect(await token.COMMUNITY_ALLOCATION()).to.equal(ethers.parseUnits("500000000", 18));
    expect(await token.DIGITAL_RESERVE_ALLOCATION()).to.equal(ethers.parseUnits("500000000", 18));
  });

  it("rejects zero treasury addresses", async function () {
    const { ethers } = await network.connect();
    const [charity, founder, development, community] = await ethers.getSigners();
    await expect(ethers.deployContract("AIONCoinV2", [
      charity.address, founder.address, development.address, community.address, ethers.ZeroAddress,
    ])).to.be.revertedWith("AION: zero reserve");
  });

  it("rejects duplicate treasury addresses", async function () {
    const { ethers } = await network.connect();
    const [charity, founder, development, community] = await ethers.getSigners();
    await expect(ethers.deployContract("AIONCoinV2", [
      charity.address, founder.address, development.address, community.address, community.address,
    ])).to.be.revertedWith("AION: duplicate treasury");
  });

  it("transfers tokens without a transfer tax or supply burn", async function () {
    const { ethers, token, founder, recipient } = await deployToken();
    const amount = ethers.parseUnits("1000", 18);
    await token.connect(founder).transfer(recipient.address, amount);

    expect(await token.balanceOf(recipient.address)).to.equal(amount);
    expect(await token.totalSupply()).to.equal(ethers.parseUnits("10000000000", 18));
    expect(await token.balanceOf(founder.address)).to.equal(ethers.parseUnits("5999999000", 18));
  });
});
