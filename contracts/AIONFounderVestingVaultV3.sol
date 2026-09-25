// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * AION FOUNDER VESTING VAULT V3
 *
 * Founder allocation: 6,000,000,000 AION
 * Cliff:              365 days
 * Linear vesting:     4 * 365 days after the cliff
 * Total schedule:     5 * 365 days from start
 *
 * Security properties:
 * - No owner/admin.
 * - Immutable AION token address.
 * - Immutable beneficiary.
 * - No minting.
 * - No acceleration.
 * - Only vested AION can be released.
 * - Every release goes to the immutable beneficiary.
 * - Start time cannot be in the past.
 *
 * The vault is intentionally limited to AION ERC-20 tokens.
 */

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AIONFounderVestingVaultV3 {
    using SafeERC20 for IERC20;

    uint256 public constant ALLOCATION = 6_000_000_000 ether;

    uint256 public constant CLIFF_DURATION = 365 days;
    uint256 public constant VESTING_DURATION = 4 * 365 days;
    uint256 public constant TOTAL_DURATION =
        CLIFF_DURATION + VESTING_DURATION;

    IERC20 public immutable token;
    address public immutable beneficiary;

    uint256 public immutable start;
    uint256 public immutable cliffEnd;
    uint256 public immutable end;

    uint256 public released;

    event Released(address indexed beneficiary, uint256 amount);

    constructor(
        address _token,
        address _beneficiary,
        uint256 _start
    ) {
        require(_token != address(0), "AION: zero token");
        require(_beneficiary != address(0), "AION: zero beneficiary");
        require(_start >= block.timestamp, "AION: start in past");

        token = IERC20(_token);
        beneficiary = _beneficiary;

        start = _start;
        cliffEnd = _start + CLIFF_DURATION;
        end = _start + TOTAL_DURATION;
    }

    function vestedAmount(uint256 timestamp)
        public
        view
        returns (uint256)
    {
        if (timestamp < cliffEnd) {
            return 0;
        }

        if (timestamp >= end) {
            return ALLOCATION;
        }

        uint256 elapsed = timestamp - cliffEnd;

        return (ALLOCATION * elapsed) / VESTING_DURATION;
    }

    function releasable() public view returns (uint256) {
        uint256 vested = vestedAmount(block.timestamp);

        if (vested <= released) {
            return 0;
        }

        return vested - released;
    }

    function release() external {
        uint256 amount = releasable();

        require(amount > 0, "AION: nothing releasable");

        require(
            token.balanceOf(address(this)) >= amount,
            "AION: vault underfunded"
        );

        released += amount;

        token.safeTransfer(beneficiary, amount);

        emit Released(beneficiary, amount);
    }

    function remainingVesting() external view returns (uint256) {
        if (released >= ALLOCATION) {
            return 0;
        }

        return ALLOCATION - released;
    }

    function vaultBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function totalScheduleDuration()
        external
        pure
        returns (uint256)
    {
        return TOTAL_DURATION;
    }
}
