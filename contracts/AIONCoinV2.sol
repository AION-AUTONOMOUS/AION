// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * AION COIN — V2
 * Fixed supply: 10,000,000,000 AION
 * Distribution: 60% founder, 25% charity, 15% operations and development.
 * Decimals: 18; transfer tax: 0%; public minting: disabled.
 * The token does not claim to be backed by fiat currency or commodities.
 */
contract AIONCoinV2 is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 10_000_000_000 ether;
    uint256 public constant FOUNDER_ALLOCATION = 6_000_000_000 ether;
    uint256 public constant CHARITY_ALLOCATION = 2_500_000_000 ether;
    uint256 public constant OPERATIONS_ALLOCATION = 1_500_000_000 ether;

    address public immutable founderTreasury;
    address public immutable charityTreasury;
    address public immutable operationsTreasury;

    constructor(address _founderTreasury, address _charityTreasury, address _operationsTreasury)
        ERC20("AION", "AION")
    {
        require(_founderTreasury != address(0), "AION: zero founder");
        require(_charityTreasury != address(0), "AION: zero charity");
        require(_operationsTreasury != address(0), "AION: zero operations");
        require(_founderTreasury != _charityTreasury, "AION: duplicate treasury");
        require(_founderTreasury != _operationsTreasury, "AION: duplicate treasury");
        require(_charityTreasury != _operationsTreasury, "AION: duplicate treasury");

        founderTreasury = _founderTreasury;
        charityTreasury = _charityTreasury;
        operationsTreasury = _operationsTreasury;

        _mint(_founderTreasury, FOUNDER_ALLOCATION);
        _mint(_charityTreasury, CHARITY_ALLOCATION);
        _mint(_operationsTreasury, OPERATIONS_ALLOCATION);
        assert(totalSupply() == INITIAL_SUPPLY);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
