// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IPaythenaCore.sol";

/**
 * @title PaythenaStaking
 * @notice Handles staking of USDe tokens and reward distribution
 * @dev Implements ReentrancyGuard, AccessControl, and Pausable for security
 */
contract PaythenaStaking is ReentrancyGuard, AccessControl, Pausable {
    using SafeERC20 for IERC20;
    using Address for address;

    // Constants
    bytes32 public constant STAKING_MANAGER_ROLE = keccak256("STAKING_MANAGER_ROLE");
    uint256 public constant MIN_STAKE_AMOUNT = 100 * 1e18; // 100 USDe minimum
    uint256 public constant MAX_STAKE_AMOUNT = 1000000 * 1e18; // 1M USDe maximum
    uint256 public constant REWARD_RATE_DENOMINATOR = 10000;
    uint256 public constant MAX_REWARD_RATE = 2000; // 20% maximum annual rate
    
    // USDe contracts on Ble Testnet
    IERC20 public constant USDE = IERC20(0x426E7d03f9803Dd11cb8616C65b99a3c0AfeA6dE);
    IERC20 public constant SUSDE = IERC20(0x80f9Ec4bA5746d8214b3A9a73cc4390AB0F0E633);
    
    // Immutable state variables
    address public immutable core;

    // Staking state
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public rewardBalance;
    mapping(address => uint256) public lastUpdateTime;
    uint256 public totalStaked;
    uint256 public rewardRate = 500; // 5% annual rate (base 10000)

    // Events
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate, uint256 timestamp);
    event EmergencyWithdraw(address indexed user, uint256 amount, uint256 timestamp);

    /**
     * @notice Contract constructor
     * @param _core The core contract address
     */
    constructor(address _core) {
        require(_core != address(0), "Invalid core address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STAKING_MANAGER_ROLE, msg.sender);
        
        core = _core;
    }

    /**
     * @notice Stake USDe tokens
     * @param amount Amount to stake
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= MIN_STAKE_AMOUNT, "Amount below minimum");
        require(amount <= MAX_STAKE_AMOUNT, "Amount above maximum");
        require(totalStaked + amount <= MAX_STAKE_AMOUNT * 1000, "Pool capacity exceeded");
        
        // Update rewards before modifying stakes
        _updateRewards(msg.sender);
        
        // Transfer tokens from user
        USDE.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update balances
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Unstake USDe tokens
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient balance");
        
        // Update rewards before modifying stakes
        _updateRewards(msg.sender);
        
        // Update balances
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        
        // Transfer tokens back to user
        USDE.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Claim accumulated rewards
     */
    function claimRewards() external nonReentrant whenNotPaused {
        _updateRewards(msg.sender);
        uint256 rewards = rewardBalance[msg.sender];
        require(rewards > 0, "No rewards available");
        
        rewardBalance[msg.sender] = 0;
        USDE.safeTransfer(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, rewards, block.timestamp);
    }

    /**
     * @notice Emergency withdraw in case of contract issues
     */
    function emergencyWithdraw() external nonReentrant {
        uint256 amount = stakedBalance[msg.sender];
        require(amount > 0, "No stake to withdraw");
        
        stakedBalance[msg.sender] = 0;
        totalStaked -= amount;
        
        USDE.safeTransfer(msg.sender, amount);
        
        emit EmergencyWithdraw(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Update reward rate
     * @param newRate New reward rate (base 10000)
     */
    function updateRewardRate(uint256 newRate) external onlyRole(STAKING_MANAGER_ROLE) {
        require(newRate <= MAX_REWARD_RATE, "Rate too high");
        uint256 oldRate = rewardRate;
        rewardRate = newRate;
        emit RewardRateUpdated(oldRate, newRate, block.timestamp);
    }

    /**
     * @notice Update rewards for an account
     * @param account Address to update rewards for
     */
    function _updateRewards(address account) private {
        uint256 timeElapsed = block.timestamp - lastUpdateTime[account];
        if (timeElapsed > 0 && stakedBalance[account] > 0) {
            uint256 rewards = (stakedBalance[account] * rewardRate * timeElapsed) / (REWARD_RATE_DENOMINATOR * 365 days);
            rewardBalance[account] += rewards;
            lastUpdateTime[account] = block.timestamp;
        }
    }

    // View functions
    function getStakedAmount(address account) external view returns (uint256) {
        return stakedBalance[account];
    }

    function getRewards(address account) external view returns (uint256) {
        return rewardBalance[account];
    }

    function getPendingRewards(address account) external view returns (uint256) {
        uint256 timeElapsed = block.timestamp - lastUpdateTime[account];
        if (timeElapsed == 0 || stakedBalance[account] == 0) {
            return rewardBalance[account];
        }
        return rewardBalance[account] + (stakedBalance[account] * rewardRate * timeElapsed) / (REWARD_RATE_DENOMINATOR * 365 days);
    }

    // Admin functions
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}