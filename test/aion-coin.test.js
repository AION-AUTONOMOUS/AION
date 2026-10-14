import { expect } from "chai";
import { network } from "hardhat";

describe("AIONCoinV2", function () {
  async function deployToken() {
    const { ethers } = await network.connect();
    const [founder, charity, operations, recipient] = await ethers.getSigners();
    const token = await ethers.deployContract("AIONCoinV2", [
      founder.address,
      charity.address,
      operations.address,
    ]);
    return { ethers, token, founder, charity, operations, recipient };
  }

  it("mints the fixed 10 billion supply using the approved 60/25/15 allocation", async function () {
    const { ethers, token, founder, charity, operations } = await deployToken();

    expect(await token.totalSupply()).to.equal(ethers.parseUnits("10000000000", 18));
    expect(await token.balanceOf(founder.address)).to.equal(ethers.parseUnits("6000000000", 18));
    expect(await token.balanceOf(charity.address)).to.equal(ethers.parseUnits("2500000000", 18));
    expect(await token.balanceOf(operations.address)).to.equal(ethers.parseUnits("1500000000", 18));
    expect(
      (await token.balanceOf(founder.address)) +
      (await token.balanceOf(charity.address)) +
      (await token.balanceOf(operations.address))
    ).to.equal(await token.totalSupply());
  });

  it("transfers tokens without a transfer tax or supply burn", async function () {
    const { ethers, token, founder, recipient } = await deployToken();
    const amount = ethers.parseUnits("1000", 18);
    await token.transfer(recipient.address, amount);

    expect(await token.balanceOf(recipient.address)).to.equal(amount);
    expect(await token.totalSupply()).to.equal(ethers.parseUnits("10000000000", 18));
    expect(await token.balanceOf(founder.address)).to.equal(ethers.parseUnits("5999999000", 18));
  });

  it("rejects duplicate treasury addresses", async function () {
    const { ethers } = await network.connect();
    const [founder, charity] = await ethers.getSigners();
    await expect(
      ethers.deployContract("AIONCoinV2", [founder.address, founder.address, charity.address])
    ).to.be.revertedWith("AION: duplicate treasury");
  });
});
