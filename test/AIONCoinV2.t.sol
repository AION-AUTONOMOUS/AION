pragma solidity ^0.8.20;

import {AIONCoinV2} from "../contracts/AIONCoinV2.sol";

contract AIONCoinV2Test {
    AIONCoinV2 token;

    address founder = address(0x1);
    address community = address(0x2);
    address aiRewards = address(0x3);
    address development = address(0x4);
    address reserve = address(0x5);
    address strategic = address(0x6);

    function setUp() public {
        token = new AIONCoinV2(
            founder,
            community,
            aiRewards,
            development,
            reserve,
            strategic
        );
    }

    function testTotalSupply() public view {
        require(
            token.totalSupply() == 10_000_000_000 ether,
            "wrong total supply"
        );
    }

    function testFounderAllocation() public view {
        require(
            token.balanceOf(founder) == 6_000_000_000 ether,
            "wrong founder allocation"
        );
    }

    function testCommunityAllocation() public view {
        require(
            token.balanceOf(community) == 1_500_000_000 ether,
            "wrong community allocation"
        );
    }

    function testAIRewardsAllocation() public view {
        require(
            token.balanceOf(aiRewards) == 1_000_000_000 ether,
            "wrong AI rewards allocation"
        );
    }

    function testDevelopmentAllocation() public view {
        require(
            token.balanceOf(development) == 700_000_000 ether,
            "wrong development allocation"
        );
    }

    function testReserveAllocation() public view {
        require(
            token.balanceOf(reserve) == 500_000_000 ether,
            "wrong reserve allocation"
        );
    }

    function testStrategicAllocation() public view {
        require(
            token.balanceOf(strategic) == 300_000_000 ether,
            "wrong strategic allocation"
        );
    }

    function testDecimals() public view {
        require(token.decimals() == 18, "wrong decimals");
    }
}
