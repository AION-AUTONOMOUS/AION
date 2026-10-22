// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * AION COIN — V2
 *
 * Approved planned tokenomics (fixed supply: 10,000,000,000 AION):
 * - Charity: 25%
 * - Founder: 60%
 * - Development: 5%
 * - Community: 5%
 * - Digital reserve: 5%
 *
 * Transfer tax: 0%. Public minting: disabled.
 * This contract does not itself verify charitable spending or impose
 * vesting on the founder allocation; those require separate controls.
 *
 * The token is not represented as backed by fiat, commodities, or any
 * other asset. A source-code change is not proof of deployment.
 */
contract AIONCoinV2 is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 10_000_000_000 ether;

    uint256 public constant CHARITY_ALLOCATION = 2_500_000_000 ether;
    uint256 public constant FOUNDER_ALLOCATION = 6_000_000_000 ether;
    uint256 public constant DEVELOPMENT_ALLOCATION = 500_000_000 ether;
    uint256 public constant COMMUNITY_ALLOCATION = 500_000_000 ether;
    uint256 public constant DIGITAL_RESERVE_ALLOCATION = 500_000_000 ether;

    address public immutable charityTreasury;
    address public immutable founderTreasury;
    address public immutable developmentTreasury;
    address public immutable communityTreasury;
    address public immutable digitalReserve;

    constructor(
        address _charityTreasury,
        address _founderTreasury,
        address _developmentTreasury,
        address _communityTreasury,
        address _digitalReserve
    ) ERC20("AION", "AION") {
        require(_charityTreasury != address(0), "AION: zero charity");
        require(_founderTreasury != address(0), "AION: zero founder");
        require(_developmentTreasury != address(0), "AION: zero development");
        require(_communityTreasury != address(0), "AION: zero community");
        require(_digitalReserve != address(0), "AION: zero reserve");

        require(_charityTreasury != _founderTreasury, "AION: duplicate treasury");
        require(_charityTreasury != _developmentTreasury, "AION: duplicate treasury");
        require(_charityTreasury != _communityTreasury, "AION: duplicate treasury");
        require(_charityTreasury != _digitalReserve, "AION: duplicate treasury");
        require(_founderTreasury != _developmentTreasury, "AION: duplicate treasury");
        require(_founderTreasury != _communityTreasury, "AION: duplicate treasury");
        require(_founderTreasury != _digitalReserve, "AION: duplicate treasury");
        require(_developmentTreasury != _communityTreasury, "AION: duplicate treasury");
        require(_developmentTreasury != _digitalReserve, "AION: duplicate treasury");
        require(_communityTreasury != _digitalReserve, "AION: duplicate treasury");

        charityTreasury = _charityTreasury;
        founderTreasury = _founderTreasury;
        developmentTreasury = _developmentTreasury;
        communityTreasury = _communityTreasury;
        digitalReserve = _digitalReserve;

        _mint(_charityTreasury, CHARITY_ALLOCATION);
        _mint(_founderTreasury, FOUNDER_ALLOCATION);
        _mint(_developmentTreasury, DEVELOPMENT_ALLOCATION);
        _mint(_communityTreasury, COMMUNITY_ALLOCATION);
        _mint(_digitalReserve, DIGITAL_RESERVE_ALLOCATION);

        assert(totalSupply() == INITIAL_SUPPLY);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
