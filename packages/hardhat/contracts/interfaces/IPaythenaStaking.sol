// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPaythenaStaking {
    // Events
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate, uint256 timestamp);
    event EmergencyWithdraw(address indexed user, uint256 amount, uint256 timestamp);

    // Core functions
    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
    function claimRewards() external;
    function emergencyWithdraw() external;

    // View functions
    function getStakedAmount(address account) external view returns (uint256);
    function getRewards(address account) external view returns (uint256);
    function getPendingRewards(address account) external view returns (uint256);
    function rewardRate() external view returns (uint256);
    function totalStaked() external view returns (uint256);
    function paused() external view returns (bool);
}