// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AIONCoin is ERC20, ERC20Burnable, Ownable {

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public constant BURN_RATE = 1;

    event Burned(address indexed from, uint256 amount);

    constructor(address initialOwner)
        ERC20("AION", "AION")
        Ownable(initialOwner)
    {
        _mint(initialOwner, MAX_SUPPLY);
    }

    function burn(uint256 amount) public override {
        super.burn(amount);
        emit Burned(msg.sender, amount);
    }

    function transferWithBurn(address to, uint256 amount) public returns (bool) {
        uint256 burnAmount = (amount * BURN_RATE) / 100;
        uint256 transferAmount = amount - burnAmount;

        _burn(msg.sender, burnAmount);
        _transfer(msg.sender, to, transferAmount);

        emit Burned(msg.sender, burnAmount);
        return true;
    }
}
