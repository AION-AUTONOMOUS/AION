import { expect } from "chai";
import { ethers } from "hardhat";

describe("AIONAssetRegistry", function () {
  it("registers and controls a tokenized-asset record", async function () {
    const [owner] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("AIONAssetRegistry");
    const registry = await Registry.deploy(owner.address);
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("evidence"));
    await expect(registry.registerAsset("AION Research Facility", "real-world-asset", "ipfs://example", hash))
      .to.emit(registry, "AssetRegistered");

    const asset = await registry.assets(1);
    expect(asset.name).to.equal("AION Research Facility");
    expect(asset.active).to.equal(true);

    await registry.setAssetStatus(1, false);
    expect((await registry.assets(1)).active).to.equal(false);
  });
});
