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
 * Founder allocation is initially minted to a founder treasury
 * address and can later be transferred into the separate
 * founder vesting vault.
 *
 * The token does NOT claim to be backed by USD, gold, silver,
 * oil, GBP, ILS, or SAR. Reserve/oracle/basket systems are separate.
 */
contract AIONCoinV2 is ERC20 {
    uint256 public constant INITIAL_SUPPLY =
        10_000_000_000 ether;

    uint256 public constant FOUNDER_ALLOCATION =
        6_000_000_000 ether;

    uint256 public constant COMMUNITY_ALLOCATION =
        1_500_000_000 ether;

    uint256 public constant AI_REWARDS_ALLOCATION =
        1_000_000_000 ether;

    uint256 public constant DEVELOPMENT_ALLOCATION =
        700_000_000 ether;

    uint256 public constant DIGITAL_RESERVE_ALLOCATION =
        500_000_000 ether;

    uint256 public constant STRATEGIC_ALLOCATION =
        300_000_000 ether;

    address public immutable founderTreasury;
    address public immutable communityTreasury;
    address public immutable aiRewardsTreasury;
    address public immutable developmentTreasury;
    address public immutable digitalReserve;
    address public immutable strategicTreasury;

    constructor(
        address _founderTreasury,
        address _communityTreasury,
        address _aiRewardsTreasury,
        address _developmentTreasury,
        address _digitalReserve,
        address _strategicTreasury
    ) ERC20("AION", "AION") {
        require(_founderTreasury != address(0), "AION: zero founder");
        require(_communityTreasury != address(0), "AION: zero community");
        require(_aiRewardsTreasury != address(0), "AION: zero AI rewards");
        require(_developmentTreasury != address(0), "AION: zero development");
        require(_digitalReserve != address(0), "AION: zero reserve");
        require(_strategicTreasury != address(0), "AION: zero strategic");

        founderTreasury = _founderTreasury;
        communityTreasury = _communityTreasury;
        aiRewardsTreasury = _aiRewardsTreasury;
        developmentTreasury = _developmentTreasury;
        digitalReserve = _digitalReserve;
        strategicTreasury = _strategicTreasury;

        _mint(_founderTreasury, FOUNDER_ALLOCATION);
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
