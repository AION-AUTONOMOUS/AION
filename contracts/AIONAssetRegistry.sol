// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * AION Tokenized Asset Registry
 *
 * Registers off-chain asset references against an on-chain immutable record.
 * This contract does not claim ownership of the underlying asset and does not
 * create a regulated security. Legal/compliance review remains external.
 */
contract AIONAssetRegistry is Ownable {
    struct Asset {
        uint256 id;
        string name;
        string assetType;
        string uri;
        bytes32 evidenceHash;
        address registrant;
        bool active;
        uint256 createdAt;
    }

    uint256 public nextAssetId = 1;
    mapping(uint256 => Asset) public assets;

    event AssetRegistered(
        uint256 indexed id,
        string name,
        string assetType,
        bytes32 indexed evidenceHash,
        address indexed registrant
    );
    event AssetStatusChanged(uint256 indexed id, bool active);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerAsset(
        string calldata name,
        string calldata assetType,
        string calldata uri,
        bytes32 evidenceHash
    ) external onlyOwner returns (uint256 id) {
        require(bytes(name).length > 0, "AION: name required");
        require(bytes(assetType).length > 0, "AION: type required");
        id = nextAssetId++;
        assets[id] = Asset({
            id: id,
            name: name,
            assetType: assetType,
            uri: uri,
            evidenceHash: evidenceHash,
            registrant: msg.sender,
            active: true,
            createdAt: block.timestamp
        });
        emit AssetRegistered(id, name, assetType, evidenceHash, msg.sender);
    }

    function setAssetStatus(uint256 id, bool active) external onlyOwner {
        require(assets[id].id != 0, "AION: unknown asset");
        assets[id].active = active;
        emit AssetStatusChanged(id, active);
    }
}
