// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IPaythenaCore.sol";

contract PaythenaAutomation is ReentrancyGuard, AccessControl, Pausable {
    using Address for address;

    bytes32 public constant AUTOMATION_ROLE = keccak256("AUTOMATION_ROLE");
    
    address public immutable core;
    uint256 public lastProcessedTime;
    uint256 public constant PROCESSING_INTERVAL = 1 days;
    uint256 public constant MAX_BATCH_SIZE = 50;

    event PaymentsProcessed(
        uint256 processedCount,
        uint256 timestamp
    );

    event AutomationConfigured(
        address indexed core,
        uint256 timestamp
    );

    constructor(address _core) {
        require(_core != address(0), "Invalid core address");
        require(_core.code.length == 0, "Core must be EOA");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AUTOMATION_ROLE, msg.sender);
        
        core = _core;
        lastProcessedTime = block.timestamp;

        emit AutomationConfigured(_core, block.timestamp);
    }

    function processPaymentBatch() 
        external 
        nonReentrant 
        whenNotPaused 
        onlyRole(AUTOMATION_ROLE) 
        returns (uint256)
    {
        require(
            block.timestamp >= lastProcessedTime + PROCESSING_INTERVAL,
            "Too early"
        );

        IPaythenaCore coreContract = IPaythenaCore(core);
        uint256 processedCount = 0;

        // Process payments for each company
        address[] memory companies = coreContract.getActiveCompanies();
        for (uint256 i = 0; i < companies.length && processedCount < MAX_BATCH_SIZE; i++) {
            address company = companies[i];
            if (!coreContract.canProcessPayment(company)) continue;

            address[] memory contributors = coreContract.getActiveContributors(company);
            for (uint256 j = 0; j < contributors.length && processedCount < MAX_BATCH_SIZE; j++) {
                address contributor = contributors[j];
                if (coreContract.isPaymentDue(company, contributor)) {
                    try coreContract.processPayment(contributor) {
                        processedCount++;
                    } catch {
                        continue;
                    }
                }
            }
        }

        lastProcessedTime = block.timestamp;
        emit PaymentsProcessed(processedCount, block.timestamp);
        return processedCount;
    }

    function pause() 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        _pause();
    }

    function unpause() 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        _unpause();
    }
}