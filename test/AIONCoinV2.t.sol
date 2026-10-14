pragma solidity ^0.8.20;

import {AIONCoinV2} from "../contracts/AIONCoinV2.sol";

contract AIONCoinV2Test {
    AIONCoinV2 token;
    address founder = address(0x1);
    address charity = address(0x2);
    address operations = address(0x3);

    function setUp() public {
        token = new AIONCoinV2(founder, charity, operations);
    }

    function testTotalSupply() public view {
        require(token.totalSupply() == 10_000_000_000 ether, "wrong total supply");
    }

    function testFounderAllocation() public view {
        require(token.balanceOf(founder) == 6_000_000_000 ether, "wrong founder allocation");
    }

    function testCharityAllocation() public view {
        require(token.balanceOf(charity) == 2_500_000_000 ether, "wrong charity allocation");
    }

    function testOperationsAllocation() public view {
        require(token.balanceOf(operations) == 1_500_000_000 ether, "wrong operations allocation");
    }

    function testAllocationsSumToSupply() public view {
        require(
            token.balanceOf(founder) + token.balanceOf(charity) + token.balanceOf(operations)
                == token.totalSupply(),
            "allocations do not sum to supply"
        );
    }

    function testDecimals() public view {
        require(token.decimals() == 18, "wrong decimals");
    }

    function testRejectsDuplicateTreasuries() public {
        bool reverted = false;
        try new AIONCoinV2(founder, founder, operations) {
            reverted = false;
        } catch {
            reverted = true;
        }
        require(reverted, "duplicate treasuries accepted");
    }
}
