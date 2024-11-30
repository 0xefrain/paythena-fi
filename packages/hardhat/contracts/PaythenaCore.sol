// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IPaythenaCore.sol";
import "./interfaces/IPaythenaStaking.sol";
import "./interfaces/IPaythenaLoan.sol";
import "./interfaces/IPaythenaAutomation.sol";
import {LoanStatus} from "./interfaces/IPaythenaLoan.sol";

/**
 * @title PaythenaCore
 * @notice Main contract for Paythena payroll system
 * @dev Handles company registration, contributor management, and payroll processing
 */
contract PaythenaCore is IPaythenaCore, ReentrancyGuard, AccessControl, Pausable {
    using SafeERC20 for IERC20;
    using Address for address;

    // Additional structs for internal use
    struct PaymentHistory {
        uint256 amount;
        uint256 timestamp;
        string description;
    }

    struct PaymentRecord {
        uint256 paymentId;
        bytes32 txHash;
        uint256 timestamp;
        uint256 amount;
        bool processed;
    }

    // State variables
    IERC20 public immutable usde;
    IPaythenaStaking public stakingContract;
    IPaythenaLoan public loanContract;
    IPaythenaAutomation public automationContract;

    // Role constants as immutable bytes32
    bytes32 private immutable _COMPANY_ROLE = keccak256("COMPANY_ROLE");
    bytes32 private immutable _CONTRIBUTOR_ROLE = keccak256("CONTRIBUTOR_ROLE");
    bytes32 private immutable _AUTOMATION_ROLE = keccak256("AUTOMATION_ROLE");
    bytes32 private immutable _INTEGRATION_ROLE = keccak256("INTEGRATION_ROLE");

    // Storage
    mapping(address => Company) public companies;
    mapping(address => address) public contributorToCompany;
    mapping(address => PaymentHistory[]) private paymentHistories;
    mapping(address => mapping(address => PaymentRecord[])) private paymentRecords;
    mapping(bytes32 => bool) private processedTxs;
    address[] private companyAddresses;
    uint256 private nextPaymentId = 1;

    // Constants
    uint256 public constant MIN_PAYMENT_FREQUENCY = 1 days;    // 86400 seconds
    uint256 public constant MAX_PAYMENT_FREQUENCY = 30 days;   // 2592000 seconds
    uint256 public constant MAX_PAYMENT_HISTORY = 10;

    // Custom errors
    error InvalidAmount();
    error CompanyNotActive();
    error CompanyAlreadyRegistered();
    error InvalidContributor();
    error InsufficientBalance();
    error UnauthorizedAccess();
    error InvalidAddress();
    error InvalidFrequency();
    error ContributorNotActive();
    error PaymentAlreadyProcessed();

    /**
     * @notice Contract constructor
     * @param _usde Address of USDe token
     * @param _stakingContract Address of staking contract
     * @param _loanContract Address of loan contract
     */
    constructor(
        address _usde,
        address _stakingContract,
        address _loanContract
    ) {
        if (_usde == address(0)) revert InvalidAddress();
        if (_stakingContract == address(0)) revert InvalidAddress();
        if (_loanContract == address(0)) revert InvalidAddress();

        usde = IERC20(_usde);
        stakingContract = IPaythenaStaking(_stakingContract);
        loanContract = IPaythenaLoan(_loanContract);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Integration functions
    function setAutomationContract(address _automationContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_automationContract == address(0)) revert InvalidAddress();
        if (_automationContract.code.length == 0) revert InvalidAddress();
        
        address oldContract = address(automationContract);
        automationContract = IPaythenaAutomation(_automationContract);
        
        if (oldContract != address(0)) {
            _revokeRole(_AUTOMATION_ROLE, oldContract);
        }
        _grantRole(_AUTOMATION_ROLE, _automationContract);
        
        emit AutomationContractUpdated(oldContract, _automationContract);
    }

    function getStakedAmount(address account) external view override returns (uint256) {
        return stakingContract.getStakedAmount(account);
    }

    function getLoanBalance(address account) external view override returns (uint256) {
        return loanContract.getLoanBalance(account);
    }

    // Override AccessControl functions
    function hasRole(bytes32 role, address account) 
        public 
        view 
        virtual 
        override(IPaythenaCore, AccessControl) 
        returns (bool) 
    {
        return super.hasRole(role, account);
    }

    function getRoleAdmin(bytes32 role)
        public
        view
        virtual
        override(IPaythenaCore, AccessControl)
        returns (bytes32)
    {
        return super.getRoleAdmin(role);
    }

    function grantRole(bytes32 role, address account)
        public
        virtual
        override(IPaythenaCore, AccessControl)
    {
        super.grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account)
        public
        virtual
        override(IPaythenaCore, AccessControl)
    {
        super.revokeRole(role, account);
    }

    function renounceRole(bytes32 role, address account)
        public
        virtual
        override(IPaythenaCore, AccessControl)
    {
        super.renounceRole(role, account);
    }

    // Role getters
    function COMPANY_ROLE() external view override returns (bytes32) {
        return _COMPANY_ROLE;
    }

    function CONTRIBUTOR_ROLE() external view override returns (bytes32) {
        return _CONTRIBUTOR_ROLE;
    }

    function AUTOMATION_ROLE() external view override returns (bytes32) {
        return _AUTOMATION_ROLE;
    }

    function INTEGRATION_ROLE() external view override returns (bytes32) {
        return _INTEGRATION_ROLE;
    }

    // Core functions
    function registerCompany(string calldata name) external override nonReentrant whenNotPaused {
        if (bytes(name).length == 0) revert InvalidAmount();
        if (companies[msg.sender].isActive) revert CompanyAlreadyRegistered();
        
        Company storage newCompany = companies[msg.sender];
        newCompany.name = name;
        newCompany.balance = 0;
        newCompany.contributorCount = 0;
        newCompany.isActive = true;
        newCompany.admin = msg.sender;
        
        companyAddresses.push(msg.sender);
        _grantRole(_COMPANY_ROLE, msg.sender);
        
        emit CompanyRegistered(msg.sender, name, block.timestamp);
    }

    function addContributor(
        address contributor,
        string calldata name,
        uint256 salary,
        uint256 paymentFrequency
    ) external override nonReentrant whenNotPaused {
        if (!hasRole(_COMPANY_ROLE, msg.sender)) revert UnauthorizedAccess();
        if (contributor == address(0)) revert InvalidAddress();
        if (bytes(name).length == 0) revert InvalidAmount();
        if (salary == 0) revert InvalidAmount();
        if (paymentFrequency < MIN_PAYMENT_FREQUENCY || 
            paymentFrequency > MAX_PAYMENT_FREQUENCY) revert InvalidFrequency();

        Company storage company = companies[msg.sender];
        if (!company.isActive) revert CompanyNotActive();

        Contributor storage cont = company.contributors[contributor];
        if (cont.isActive) revert ContributorNotActive();

        cont.name = name;
        cont.salary = salary;
        cont.paymentFrequency = paymentFrequency;
        cont.nextPayment = block.timestamp + paymentFrequency;
        cont.isActive = true;
        cont.lastProcessedTime = block.timestamp;

        company.contributorCount++;
        company.contributorAddresses.push(contributor);
        contributorToCompany[contributor] = msg.sender;
        _grantRole(_CONTRIBUTOR_ROLE, contributor);

        emit ContributorAdded(msg.sender, contributor, name, salary, block.timestamp);
    }

    function removeContributor(address contributor) external override nonReentrant whenNotPaused {
        if (!hasRole(_COMPANY_ROLE, msg.sender)) revert UnauthorizedAccess();
        
        Company storage company = companies[msg.sender];
        if (!company.isActive) revert CompanyNotActive();
        
        Contributor storage cont = company.contributors[contributor];
        if (!cont.isActive) revert ContributorNotActive();
        
        cont.isActive = false;
        company.contributorCount--;
        contributorToCompany[contributor] = address(0);
        _revokeRole(_CONTRIBUTOR_ROLE, contributor);
        
        emit ContributorRemoved(msg.sender, contributor, block.timestamp);
    }

    function processSalary(address contributor) external override nonReentrant whenNotPaused {
        if (!hasRole(_COMPANY_ROLE, msg.sender)) revert UnauthorizedAccess();
        
        Company storage company = companies[msg.sender];
        if (!company.isActive) revert CompanyNotActive();

        Contributor storage cont = company.contributors[contributor];
        if (!cont.isActive) revert ContributorNotActive();
        if (block.timestamp < cont.nextPayment) revert PaymentAlreadyProcessed();
        if (company.balance < cont.salary) revert InsufficientBalance();

        uint256 paymentId = nextPaymentId++;
        bytes32 txHash = keccak256(abi.encodePacked(
            msg.sender,
            contributor,
            paymentId,
            block.timestamp
        ));

        if (processedTxs[txHash]) revert PaymentAlreadyProcessed();
        processedTxs[txHash] = true;

        company.balance -= cont.salary;
        cont.lastPayment = block.timestamp;
        cont.nextPayment = block.timestamp + cont.paymentFrequency;
        cont.lastProcessedTime = block.timestamp;

        PaymentRecord memory record = PaymentRecord({
            paymentId: paymentId,
            txHash: txHash,
            timestamp: block.timestamp,
            amount: cont.salary,
            processed: true
        });

        paymentRecords[msg.sender][contributor].push(record);
        usde.safeTransfer(contributor, cont.salary);

        emit PaymentProcessed(
            paymentId,
            msg.sender,
            contributor,
            cont.salary,
            txHash,
            block.timestamp
        );
    }

    // Fund management functions
    function deposit(uint256 amount) external override nonReentrant whenNotPaused {
        if (!hasRole(_COMPANY_ROLE, msg.sender)) revert UnauthorizedAccess();
        if (amount == 0) revert InvalidAmount();
        
        Company storage company = companies[msg.sender];
        if (!company.isActive) revert CompanyNotActive();

        company.balance += amount;
        usde.safeTransferFrom(msg.sender, address(this), amount);
        
        emit FundsDeposited(msg.sender, amount, block.timestamp);
    }

    function withdraw(uint256 amount) external override nonReentrant whenNotPaused {
        if (!hasRole(_COMPANY_ROLE, msg.sender)) revert UnauthorizedAccess();
        if (amount == 0) revert InvalidAmount();
        
        Company storage company = companies[msg.sender];
        if (!company.isActive) revert CompanyNotActive();
        if (company.balance < amount) revert InsufficientBalance();

        company.balance -= amount;
        usde.safeTransfer(msg.sender, amount);
        
        emit FundsWithdrawn(msg.sender, amount, block.timestamp);
    }

    // Automation functions
    function processPaymentBatch(address[] calldata contributors) 
        external 
        override 
        onlyRole(_AUTOMATION_ROLE) 
        nonReentrant 
        whenNotPaused 
        returns (uint256)
    {
        if (msg.sender != address(automationContract)) revert UnauthorizedAccess();
        
        uint256 processedCount = 0;

        for (uint256 i = 0; i < contributors.length; i++) {
            address contributor = contributors[i];
            address companyAddr = contributorToCompany[contributor];
            
            if (!isPaymentDue(companyAddr, contributor)) continue;
            if (!canProcessPayment(companyAddr)) continue;

            try this.processSalary(contributor) {
                processedCount++;
            } catch {
                emit IntegrationError("Payment failed", "");
                continue;
            }
        }

        return processedCount;
    }

    // View functions
    function getCompanyDetails(address company) external view override returns (
        string memory name,
        uint256 balance,
        uint256 contributorCount,
        bool isActive,
        address admin
    ) {
        Company storage comp = companies[company];
        return (
            comp.name,
            comp.balance,
            comp.contributorCount,
            comp.isActive,
            comp.admin
        );
    }

    function getContributorDetails(
        address company,
        address contributor
    ) external view override returns (
        string memory name,
        uint256 salary,
        uint256 nextPayment,
        uint256 paymentFrequency,
        bool isActive,
        uint256 lastProcessedTime
    ) {
        Contributor storage cont = companies[company].contributors[contributor];
        return (
            cont.name,
            cont.salary,
            cont.nextPayment,
            cont.paymentFrequency,
            cont.isActive,
            cont.lastProcessedTime
        );
    }

    // Helper functions
    function isPaymentDue(address company, address contributor) 
        public 
        view 
        override 
        returns (bool) 
    {
        Company storage comp = companies[company];
        if (!comp.isActive) return false;

        Contributor storage cont = comp.contributors[contributor];
        return cont.isActive && block.timestamp >= cont.nextPayment;
    }

    function canProcessPayment(address company) 
        public 
        view 
        override 
        returns (bool) 
    {
        Company storage comp = companies[company];
        if (!comp.isActive || paused()) return false;

        uint256 totalPayroll = getTotalPayroll(company);
        return comp.balance >= totalPayroll;
    }

    function getActiveCompanies() 
        external 
        view 
        override 
        returns (address[] memory) 
    {
        uint256 count = 0;
        for (uint256 i = 0; i < companyAddresses.length; i++) {
            if (companies[companyAddresses[i]].isActive) {
                count++;
            }
        }

        address[] memory activeCompanies = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < companyAddresses.length; i++) {
            if (companies[companyAddresses[i]].isActive) {
                activeCompanies[index] = companyAddresses[i];
                index++;
            }
        }

        return activeCompanies;
    }

    function getActiveContributors(address company) 
        external 
        view 
        override 
        returns (address[] memory) 
    {
        Company storage comp = companies[company];
        if (!comp.isActive) revert CompanyNotActive();

        uint256 count = 0;
        for (uint256 i = 0; i < comp.contributorAddresses.length; i++) {
            if (comp.contributors[comp.contributorAddresses[i]].isActive) {
                count++;
            }
        }

        address[] memory activeContributors = new address[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < comp.contributorAddresses.length; i++) {
            address contributor = comp.contributorAddresses[i];
            if (comp.contributors[contributor].isActive) {
                activeContributors[index] = contributor;
                index++;
            }
        }

        return activeContributors;
    }

    function getTotalPayroll(address company) 
        public 
        view 
        override 
        returns (uint256) 
    {
        Company storage comp = companies[company];
        if (!comp.isActive) return 0;

        uint256 total = 0;
        for (uint256 i = 0; i < comp.contributorAddresses.length; i++) {
            address contributor = comp.contributorAddresses[i];
            if (comp.contributors[contributor].isActive) {
                total += comp.contributors[contributor].salary;
            }
        }

        return total;
    }

    // Emergency functions
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setStakingContract(address _stakingContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_stakingContract == address(0)) revert InvalidAddress();
        if (_stakingContract.code.length == 0) revert InvalidAddress();
        stakingContract = IPaythenaStaking(_stakingContract);
    }

    function setLoanContract(address _loanContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_loanContract == address(0)) revert InvalidAddress();
        if (_loanContract.code.length == 0) revert InvalidAddress();
        loanContract = IPaythenaLoan(_loanContract);
    }

    // Integration view functions
    function getStakingInfo(address account) 
        external 
        view 
        returns (
            uint256 stakedAmount,
            uint256 pendingRewards,
            uint256 currentRate
        ) 
    {
        try stakingContract.getStakedAmount(account) returns (uint256 staked) {
            try stakingContract.getPendingRewards(account) returns (uint256 pending) {
                try stakingContract.rewardRate() returns (uint256 rate) {
                    return (staked, pending, rate);
                } catch {
                    return (staked, pending, 0);
                }
            } catch {
                return (staked, 0, 0);
            }
        } catch {
            return (0, 0, 0);
        }
    }

    function getLoanInfo(address borrower) 
        external 
        view 
        returns (
            uint256 loanBalance,
            uint256 creditScore,
            LoanStatus status
        ) 
    {
        try loanContract.getLoanDetails(borrower) returns (
            uint256,  // amount
            uint256,  // totalDue
            uint256,  // monthlyPayment
            uint256,  // remainingAmount
            uint256,  // nextPaymentDue
            LoanStatus loanStatus
        ) {
            try loanContract.getLoanBalance(borrower) returns (uint256 balance) {
                try loanContract.getCreditScore(borrower) returns (uint256 score) {
                    return (balance, score, loanStatus);
                } catch {
                    return (balance, 0, loanStatus);
                }
            } catch {
                return (0, 0, loanStatus);
            }
        } catch {
            return (0, 0, LoanStatus.None);
        }
    }

    function getAutomationInfo() 
        external 
        view 
        returns (
            uint256 interval,
            uint256 batchSize,
            uint256 lastProcessed,
            bool isActive
        ) 
    {
        if (address(automationContract) == address(0)) {
            return (0, 0, 0, false);
        }

        try automationContract.PROCESSING_INTERVAL() returns (uint256 _interval) {
            try automationContract.MAX_BATCH_SIZE() returns (uint256 _batchSize) {
                try automationContract.lastProcessedTime() returns (uint256 _lastProcessed) {
                    return (_interval, _batchSize, _lastProcessed, !paused());
                } catch {
                    return (_interval, _batchSize, 0, !paused());
                }
            } catch {
                return (_interval, 0, 0, !paused());
            }
        } catch {
            return (0, 0, 0, !paused());
        }
    }

    // Add helper function to check integration status
    function checkIntegrationStatus() 
        external 
        view 
        returns (
            bool stakingActive,
            bool loanActive,
            bool automationActive
        ) 
    {
        stakingActive = address(stakingContract) != address(0) && 
                       !stakingContract.paused();
        
        loanActive = address(loanContract) != address(0) && 
                    !loanContract.paused();
        
        automationActive = address(automationContract) != address(0) && 
                          !automationContract.paused();
    }
}