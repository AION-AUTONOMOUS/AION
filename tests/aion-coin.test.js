import { expect } from "chai";
import { ethers } from "hardhat";

describe("AIONCoin", function () {
  it("mints the fixed 10 billion supply to the owner", async function () {
    const [owner] = await ethers.getSigners();
    const token = await ethers.deployContract("AIONCoin", [owner.address]);
    expect(await token.totalSupply()).to.equal(ethers.parseUnits("10000000000", 18));
    expect(await token.balanceOf(owner.address)).to.equal(await token.totalSupply());
  });

  it("burns 1% only through transferWithBurn", async function () {
    const [owner, recipient] = await ethers.getSigners();
    const token = await ethers.deployContract("AIONCoin", [owner.address]);
    const amount = ethers.parseUnits("1000", 18);
    await token.transferWithBurn(recipient.address, amount);
    expect(await token.balanceOf(recipient.address)).to.equal(ethers.parseUnits("990", 18));
    expect(await token.totalSupply()).to.equal(ethers.parseUnits("9999999000", 18));
  });
});