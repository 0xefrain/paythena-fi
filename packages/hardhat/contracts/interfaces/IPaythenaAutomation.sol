// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPaythenaAutomation {
    // Events
    event PaymentsProcessed(uint256 processedCount, uint256 timestamp);
    event AutomationConfigured(address indexed core, uint256 timestamp);
    event AutomationEnabled(address indexed company);
    event AutomationDisabled(address indexed company);

    // Core functions
    function processPaymentBatch() external returns (uint256);
    function enableAutomation() external;
    function disableAutomation() external;

    // View functions
    function automatedCompanies(address company) external view returns (bool);
    function AUTOMATION_ROLE() external view returns (bytes32);
    function lastProcessedTime() external view returns (uint256);
    function PROCESSING_INTERVAL() external view returns (uint256);
    function MAX_BATCH_SIZE() external view returns (uint256);
    function core() external view returns (address);
    function paused() external view returns (bool);
}