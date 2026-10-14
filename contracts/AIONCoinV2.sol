// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * AION COIN — V2
 *
 * Fixed supply: 10,000,000,000 AION
 * Decimals: 18
 * Transfer tax: 0%
 * Public minting: disabled
 *
 * Approved allocation target:
 * Founder 60%; charitable perpetual-giving treasury 25%;
 * remaining five operational allocations share 15% proportionally.
 *
 * The charity treasury address must be designated and independently
 * verified before deployment. This allocation alone does not verify
 * the recipient's charitable status or impose legal restrictions on transfers.
 *
 * The token does NOT claim to be backed by USD, gold, silver,
 * oil, GBP, ILS, or SAR. Reserve/oracle/basket systems are separate.
 */
contract AIONCoinV2 is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 10_000_000_000 ether;

    uint256 public constant FOUNDER_ALLOCATION = 6_000_000_000 ether;
    uint256 public constant CHARITY_ALLOCATION = 2_500_000_000 ether;

    // Remaining 15% allocated proportionally to the previous five non-founder pools.
    uint256 public constant COMMUNITY_ALLOCATION = 562_500_000 ether;
    uint256 public constant AI_REWARDS_ALLOCATION = 375_000_000 ether;
    uint256 public constant DEVELOPMENT_ALLOCATION = 262_500_000 ether;
    uint256 public constant DIGITAL_RESERVE_ALLOCATION = 187_500_000 ether;
    uint256 public constant STRATEGIC_ALLOCATION = 112_500_000 ether;

    address public immutable founderTreasury;
    address public immutable charityTreasury;
    address public immutable communityTreasury;
    address public immutable aiRewardsTreasury;
    address public immutable developmentTreasury;
    address public immutable digitalReserve;
    address public immutable strategicTreasury;

    constructor(
        address _founderTreasury,
        address _charityTreasury,
        address _communityTreasury,
        address _aiRewardsTreasury,
        address _developmentTreasury,
        address _digitalReserve,
        address _strategicTreasury
    ) ERC20("AION", "AION") {
        require(_founderTreasury != address(0), "AION: zero founder");
        require(_charityTreasury != address(0), "AION: zero charity");
        require(_communityTreasury != address(0), "AION: zero community");
        require(_aiRewardsTreasury != address(0), "AION: zero AI rewards");
        require(_developmentTreasury != address(0), "AION: zero development");
        require(_digitalReserve != address(0), "AION: zero reserve");
        require(_strategicTreasury != address(0), "AION: zero strategic");

        founderTreasury = _founderTreasury;
        charityTreasury = _charityTreasury;
        communityTreasury = _communityTreasury;
        aiRewardsTreasury = _aiRewardsTreasury;
        developmentTreasury = _developmentTreasury;
        digitalReserve = _digitalReserve;
        strategicTreasury = _strategicTreasury;

        _mint(_founderTreasury, FOUNDER_ALLOCATION);
        _mint(_charityTreasury, CHARITY_ALLOCATION);
        _mint(_communityTreasury, COMMUNITY_ALLOCATION);
        _mint(_aiRewardsTreasury, AI_REWARDS_ALLOCATION);
        _mint(_developmentTreasury, DEVELOPMENT_ALLOCATION);
        _mint(_digitalReserve, DIGITAL_RESERVE_ALLOCATION);
        _mint(_strategicTreasury, STRATEGIC_ALLOCATION);

        assert(totalSupply() == INITIAL_SUPPLY);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
