pragma solidity ^0.8.20;

import {AIONFounderVestingVaultV3} from "../contracts/AIONFounderVestingVaultV3.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockAIONToken is IERC20 {
    string public name = "AION";
    string public symbol = "AION";
    uint8 public decimals = 18;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    function mint(address to, uint256 amount) external {
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender)
        external
        view
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount)
        external
        returns (bool)
    {
        uint256 allowed = _allowances[from][msg.sender];
        require(allowed >= amount, "allowance");
        _allowances[from][msg.sender] = allowed - amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(_balances[from] >= amount, "balance");
        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }
}

contract AIONFounderVestingVaultV3Test {
    uint256 constant ALLOCATION = 6_000_000_000 ether;
    uint256 constant CLIFF = 365 days;
    uint256 constant VESTING = 4 * 365 days;
    uint256 constant TOTAL = 5 * 365 days;

    address beneficiary = address(0xBEEF);
    MockAIONToken token;
    AIONFounderVestingVaultV3 vault;

    function setUp() public {
        token = new MockAIONToken();
        vault = new AIONFounderVestingVaultV3(
            address(token),
            beneficiary,
            block.timestamp
        );
        token.mint(address(vault), ALLOCATION);
    }

    function testConstantsAndSchedule() public view {
        require(vault.ALLOCATION() == ALLOCATION, "wrong allocation");
        require(vault.CLIFF_DURATION() == CLIFF, "wrong cliff");
        require(vault.VESTING_DURATION() == VESTING, "wrong vesting");
        require(vault.TOTAL_DURATION() == TOTAL, "wrong total duration");
        require(
            vault.totalScheduleDuration() == TOTAL,
            "wrong schedule duration"
        );
    }

    function testImmutableConfiguration() public view {
        require(address(vault.token()) == address(token), "wrong token");
        require(vault.beneficiary() == beneficiary, "wrong beneficiary");
        require(vault.start() == block.timestamp, "wrong start");
        require(vault.cliffEnd() == block.timestamp + CLIFF, "wrong cliff end");
        require(vault.end() == block.timestamp + TOTAL, "wrong end");
    }

    function testNothingVestsBeforeCliff() public view {
        uint256 start = vault.start();

        require(vault.vestedAmount(start) == 0, "vested at start");
        require(vault.vestedAmount(start + CLIFF - 1) == 0, "vested before cliff");
        require(vault.vestedAmount(vault.cliffEnd() - 1) == 0, "vested before cliff end");
    }

    function testLinearVesting() public view {
        uint256 cliffEnd = vault.cliffEnd();
        uint256 quarter = ALLOCATION / 4;
        uint256 half = ALLOCATION / 2;
        uint256 threeQuarter = (ALLOCATION * 3) / 4;

        require(vault.vestedAmount(cliffEnd) == 0, "wrong cliff amount");
        require(
            vault.vestedAmount(cliffEnd + VESTING / 4) == quarter,
            "wrong quarter amount"
        );
        require(
            vault.vestedAmount(cliffEnd + VESTING / 2) == half,
            "wrong half amount"
        );
        require(
            vault.vestedAmount(cliffEnd + (VESTING * 3) / 4) == threeQuarter,
            "wrong three-quarter amount"
        );
    }

    function testFullVestingAtEnd() public view {
        require(vault.vestedAmount(vault.end() - 1) < ALLOCATION, "vests too early");
        require(vault.vestedAmount(vault.end()) == ALLOCATION, "not fully vested");
        require(
            vault.vestedAmount(vault.end() + 365 days) == ALLOCATION,
            "vesting exceeded allocation"
        );
    }

    function testInitialReleaseState() public view {
        require(vault.released() == 0, "released should start at zero");
        require(vault.remainingVesting() == ALLOCATION, "wrong remaining vesting");
        require(vault.vaultBalance() == ALLOCATION, "wrong vault balance");
        require(vault.releasable() == 0, "tokens should not be releasable");
    }

    function testReleaseBeforeCliffReverts() public {
        (bool ok,) = address(vault).call(
            abi.encodeWithSelector(AIONFounderVestingVaultV3.release.selector)
        );
        require(!ok, "release should revert before cliff");
    }
}
