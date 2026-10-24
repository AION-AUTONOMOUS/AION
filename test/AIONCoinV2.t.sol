// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AIONCoinV2} from "../contracts/AIONCoinV2.sol";

contract AIONCoinV2Test {
    AIONCoinV2 token;

    address charity = address(0x1);
    address founder = address(0x2);
    address development = address(0x3);
    address community = address(0x4);
    address reserve = address(0x5);

    function setUp() public {
        token = new AIONCoinV2(charity, founder, development, community, reserve);
    }

    function testTotalSupply() public view {
        require(token.totalSupply() == 10_000_000_000 ether, "wrong total supply");
    }

    function testCharityAllocation() public view {
        require(token.balanceOf(charity) == 2_500_000_000 ether, "wrong charity allocation");
    }

    function testFounderAllocation() public view {
        require(token.balanceOf(founder) == 6_000_000_000 ether, "wrong founder allocation");
    }

    function testDevelopmentAllocation() public view {
        require(token.balanceOf(development) == 500_000_000 ether, "wrong development allocation");
    }

    function testCommunityAllocation() public view {
        require(token.balanceOf(community) == 500_000_000 ether, "wrong community allocation");
    }

    function testReserveAllocation() public view {
        require(token.balanceOf(reserve) == 500_000_000 ether, "wrong reserve allocation");
    }

    function testDecimals() public view {
        require(token.decimals() == 18, "wrong decimals");
    }
}
