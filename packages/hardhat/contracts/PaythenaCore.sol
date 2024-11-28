// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IPaythenaStaking.sol";
import "./interfaces/IPaythenaLoan.sol";

/**
 * @title PaythenaCore
 * @notice Main contract for Paythena payroll system
 * @dev Handles company registration, contributor management, and payroll processing
 */
contract PaythenaCore is ReentrancyGuard, AccessControl, Pausable {
    using SafeERC20 for IERC20;
    using Address for address;

    // Constants
    bytes32 public constant COMPANY_ROLE = keccak256("COMPANY_ROLE");
    bytes32 public constant CONTRIBUTOR_ROLE = keccak256("CONTRIBUTOR_ROLE");
    uint256 public constant MIN_PAYMENT_FREQUENCY = 1 days;
    uint256 public constant MAX_PAYMENT_FREQUENCY = 30 days;

    // State variables
    IERC20 public immutable usde;
    address public immutable stakingContract;
    address public immutable loanContract;

    // Structs
    struct Contributor {
        string name;
        uint256 salary;
        uint256 lastPayment;
        uint256 nextPayment;
        uint256 paymentFrequency;
        uint256 lastProcessedTime;
        bool isActive;
    }

    struct Company {
        string name;
        uint256 balance;
        uint256 contributorCount;
        bool isActive;
        address admin;
        mapping(address => Contributor) contributors;
        address[] contributorAddresses;
    }

    struct CompanyDashboardData {
        string name;
        uint256 totalContributors;
        uint256 totalPayroll;
        uint256 availableBalance;
        uint256 nextPaymentDate;
        uint256 stakedAmount;
        bool isActive;
        ContributorInfo[] activeContributors;
    }

    struct ContributorDashboardData {
        string name;
        uint256 salary;
        uint256 nextPayment;
        uint256 lastPayment;
        uint256 stakedAmount;
        uint256 loanBalance;
        bool isActive;
        address companyAddress;
        string companyName;
        PaymentHistory[] recentPayments;
    }

    struct ContributorInfo {
        address contributorAddress;
        string name;
        uint256 salary;
        uint256 nextPayment;
        bool isActive;
    }

    struct PaymentHistory {
        uint256 amount;
        uint256 timestamp;
        string description;
    }

    // Mappings
    mapping(address => Company) public companies;
    mapping(address => address) public contributorToCompany;
    mapping(address => PaymentHistory[]) private paymentHistories;
    uint256 public constant MAX_PAYMENT_HISTORY = 10;
    uint256 public constant MAX_ACTIVE_CONTRIBUTORS = 50;

    // Events
    event CompanyRegistered(
        address indexed company,
        string name,
        uint256 timestamp
    );

    event ContributorAdded(
        address indexed company,
        address indexed contributor,
        string name,
        uint256 salary,
        uint256 timestamp
    );

    event ContributorRemoved(
        address indexed company,
        address indexed contributor,
        uint256 timestamp
    );

    event SalaryProcessed(
        address indexed company,
        address indexed contributor,
        uint256 amount,
        uint256 timestamp
    );

    event FundsDeposited(
        address indexed company,
        uint256 amount,
        uint256 timestamp
    );

    event FundsWithdrawn(
        address indexed company,
        uint256 amount,
        uint256 timestamp
    );

    // Add storage layout version
    uint256 private constant STORAGE_VERSION = 1;

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
        require(_usde != address(0), "Invalid USDe address");
        require(_stakingContract != address(0), "Invalid staking address");
        require(_loanContract != address(0), "Invalid loan address");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        usde = IERC20(_usde);
        stakingContract = _stakingContract;
        loanContract = _loanContract;
    }

    // Add initialization function
    function _initializeCompany(
        address companyAddress,
        string memory name
    ) 
        private 
    {
        Company storage newCompany = companies[companyAddress];
        newCompany.name = name;
        newCompany.balance = 0;
        newCompany.contributorCount = 0;
        newCompany.isActive = true;
    }

    /**
     * @notice Registers a new company
     * @param _name Company name
     */
    function registerCompany(string calldata _name) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(bytes(_name).length > 0, "Name required");
        require(!companies[msg.sender].isActive, "Company exists");
        
        Company storage newCompany = companies[msg.sender];
        newCompany.name = _name;
        newCompany.balance = 0;
        newCompany.contributorCount = 0;
        newCompany.isActive = true;
        newCompany.admin = msg.sender;
        
        _grantRole(COMPANY_ROLE, msg.sender);
        
        emit CompanyRegistered(
            msg.sender,
            _name,
            block.timestamp
        );
    }

    /**
     * @notice Adds a new contributor to a company
     * @param _contributor Contributor's address
     * @param _name Contributor's name
     * @param _salary Contributor's salary in USDe
     * @param _paymentFrequency Payment frequency in seconds
     */
    function addContributor(
        address _contributor,
        string calldata _name,
        uint256 _salary,
        uint256 _paymentFrequency
    ) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(_contributor != address(0), "Invalid contributor address");
        require(_contributor != msg.sender, "Cannot add self as contributor");
        require(_salary > 0, "Invalid salary");
        require(_paymentFrequency >= MIN_PAYMENT_FREQUENCY, "Frequency too short");
        require(_paymentFrequency <= MAX_PAYMENT_FREQUENCY, "Frequency too long");
        require(bytes(_name).length > 0, "Name required");
        require(_contributor.code.length == 0, "Contributor cannot be contract");

        Company storage company = companies[msg.sender];
        require(company.isActive, "Company not active");
        require(
            company.contributors[_contributor].salary == 0,
            "Contributor exists"
        );

        company.contributors[_contributor] = Contributor({
            name: _name,
            salary: _salary,
            lastPayment: 0,
            nextPayment: block.timestamp + _paymentFrequency,
            paymentFrequency: _paymentFrequency,
            lastProcessedTime: block.timestamp,
            isActive: true
        });

        company.contributorAddresses.push(_contributor);
        company.contributorCount++;
        contributorToCompany[_contributor] = msg.sender;
        _grantRole(CONTRIBUTOR_ROLE, _contributor);

        emit ContributorAdded(
            msg.sender,
            _contributor,
            _name,
            _salary,
            block.timestamp
        );
    }

    /**
     * @notice Process salary payment for a contributor
     * @param _contributor Address of the contributor
     */
    function processSalary(address _contributor) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(hasRole(COMPANY_ROLE, msg.sender), "Not a company");
        Company storage company = companies[msg.sender];
        require(company.isActive, "Company not active");

        Contributor storage contributor = company.contributors[_contributor];
        require(contributor.isActive, "Contributor not active");
        require(block.timestamp >= contributor.nextPayment, "Payment not due");
        require(company.balance >= contributor.salary, "Insufficient balance");

        company.balance -= contributor.salary;
        contributor.lastProcessedTime = block.timestamp;
        contributor.nextPayment = block.timestamp + contributor.paymentFrequency;

        usde.safeTransfer(_contributor, contributor.salary);

        emit SalaryProcessed(
            msg.sender,
            _contributor,
            contributor.salary,
            block.timestamp
        );
    }

    /**
     * @notice Fund company balance
     */
    function fundCompany() external payable whenNotPaused nonReentrant {
        require(hasRole(COMPANY_ROLE, msg.sender), "Not a company");
        require(msg.value > 0, "Zero amount");

        Company storage company = companies[msg.sender];
        require(company.isActive, "Company not active");

        company.balance += msg.value;

        emit FundsDeposited(msg.sender, msg.value, company.balance);
    }

    /**
     * @notice Emergency pause
     */
    function pause() external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not admin");
        _pause();
    }

    /**
     * @notice Emergency unpause
     */
    function unpause() external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not admin");
        _unpause();
    }

    /**
     * @notice Get company details
     * @param _company Company address
     */
    function getCompanyDetails(address _company)
        external
        view
        returns (
            string memory name,
            uint256 balance,
            uint256 contributorCount,
            bool isActive,
            address admin
        )
    {
        Company storage company = companies[_company];
        return (
            company.name,
            company.balance,
            company.contributorCount,
            company.isActive,
            company.admin
        );
    }

    /**
     * @notice Get contributor details
     * @param _company Company address
     * @param _contributor Contributor address
     */
    function getContributorDetails(address _company, address _contributor)
        external
        view
        returns (
            string memory name,
            uint256 salary,
            uint256 nextPayment,
            uint256 paymentFrequency,
            bool isActive,
            uint256 lastProcessedTime
        )
    {
        Contributor storage contributor = companies[_company].contributors[_contributor];
        return (
            contributor.name,
            contributor.salary,
            contributor.nextPayment,
            contributor.paymentFrequency,
            contributor.isActive,
            contributor.lastProcessedTime
        );
    }

    /**
     * @notice Get next payment date for a company
     * @param companyAddress Company address
     */
    function _getNextCompanyPayment(address companyAddress) 
        internal 
        view 
        returns (uint256) 
    {
        Company storage company = companies[companyAddress];
        uint256 nextPayment = type(uint256).max;
        
        for (uint256 i = 0; i < company.contributorAddresses.length; i++) {
            address contributorAddress = company.contributorAddresses[i];
            Contributor storage contributor = company.contributors[contributorAddress];
            
            if (contributor.isActive && contributor.nextPayment < nextPayment) {
                nextPayment = contributor.nextPayment;
            }
        }
        
        return nextPayment == type(uint256).max ? 0 : nextPayment;
    }

    /**
     * @notice Add payment to history
     * @param contributor Contributor address
     * @param amount Payment amount
     * @param description Payment description
     */
    function _addPaymentToHistory(
        address contributor, 
        uint256 amount, 
        string memory description
    ) 
        internal 
    {
        PaymentHistory[] storage history = paymentHistories[contributor];
        
        if (history.length >= MAX_PAYMENT_HISTORY) {
            // Remove oldest payment if at max capacity
            for (uint256 i = 0; i < history.length - 1; i++) {
                history[i] = history[i + 1];
            }
            history.pop();
        }
        
        history.push(PaymentHistory({
            amount: amount,
            timestamp: block.timestamp,
            description: description
        }));
    }

    /**
     * @notice Process payment and update history
     * @param contributor Contributor address
     */
    function processPayment(address contributor) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256)
    {
        require(hasRole(COMPANY_ROLE, msg.sender), "Not a company");
        Company storage company = companies[msg.sender];
        Contributor storage cont = company.contributors[contributor];
        
        require(cont.isActive, "Contributor not active");
        require(block.timestamp >= cont.nextPayment, "Payment not due");
        require(company.balance >= cont.salary, "Insufficient balance");

        company.balance -= cont.salary;
        usde.safeTransfer(contributor, cont.salary);
        
        cont.lastPayment = block.timestamp;
        cont.nextPayment = block.timestamp + cont.paymentFrequency;
        cont.lastProcessedTime = block.timestamp;
        
        _addPaymentToHistory(
            contributor,
            cont.salary,
            "Regular salary payment"
        );
        
        emit SalaryProcessed(
            msg.sender, 
            contributor, 
            cont.salary,
            block.timestamp
        );
        
        return cont.salary;
    }

    /**
     * @notice Get company dashboard data
     * @param companyAddress Address of the company
     */
    function getCompanyDashboard(address companyAddress) 
        external 
        view 
        returns (CompanyDashboardData memory) 
    {
        require(hasRole(COMPANY_ROLE, companyAddress), "Not a company");
        
        Company storage company = companies[companyAddress];
        uint256 stakedAmount = IPaythenaStaking(stakingContract).getStakedAmount(companyAddress);
        
        ContributorInfo[] memory activeContributors = new ContributorInfo[](
            company.contributorAddresses.length > MAX_ACTIVE_CONTRIBUTORS ? 
            MAX_ACTIVE_CONTRIBUTORS : 
            company.contributorAddresses.length
        );
        
        uint256 activeCount = 0;
        uint256 totalPayroll = 0;
        
        for (uint256 i = 0; i < company.contributorAddresses.length && activeCount < MAX_ACTIVE_CONTRIBUTORS; i++) {
            address contributorAddress = company.contributorAddresses[i];
            Contributor storage contributor = company.contributors[contributorAddress];
            
            if (contributor.isActive) {
                activeContributors[activeCount] = ContributorInfo({
                    contributorAddress: contributorAddress,
                    name: contributor.name,
                    salary: contributor.salary,
                    nextPayment: contributor.nextPayment,
                    isActive: contributor.isActive
                });
                activeCount++;
                totalPayroll += contributor.salary;
            }
        }

        return CompanyDashboardData({
            name: company.name,
            totalContributors: company.contributorCount,
            totalPayroll: totalPayroll,
            availableBalance: company.balance,
            nextPaymentDate: _getNextCompanyPayment(companyAddress),
            stakedAmount: stakedAmount,
            isActive: company.isActive,
            activeContributors: activeContributors
        });
    }

    /**
     * @notice Get contributor dashboard data
     * @param contributorAddress Address of the contributor
     */
    function getContributorDashboard(address contributorAddress) 
        external 
        view 
        returns (ContributorDashboardData memory) 
    {
        require(hasRole(CONTRIBUTOR_ROLE, contributorAddress), "Not a contributor");
        
        address companyAddress = contributorToCompany[contributorAddress];
        require(companyAddress != address(0), "No company found");
        
        Company storage company = companies[companyAddress];
        Contributor storage contributor = company.contributors[contributorAddress];
        
        uint256 stakedAmount = IPaythenaStaking(stakingContract).getStakedAmount(contributorAddress);
        uint256 loanBalance = IPaythenaLoan(loanContract).getLoanBalance(contributorAddress);
        
        PaymentHistory[] memory recentPayments = new PaymentHistory[](
            paymentHistories[contributorAddress].length > MAX_PAYMENT_HISTORY ? 
            MAX_PAYMENT_HISTORY : 
            paymentHistories[contributorAddress].length
        );
        
        for (uint256 i = 0; i < recentPayments.length; i++) {
            recentPayments[i] = paymentHistories[contributorAddress][
                paymentHistories[contributorAddress].length - 1 - i
            ];
        }

        return ContributorDashboardData({
            name: contributor.name,
            salary: contributor.salary,
            nextPayment: contributor.nextPayment,
            lastPayment: contributor.lastPayment,
            stakedAmount: stakedAmount,
            loanBalance: loanBalance,
            isActive: contributor.isActive,
            companyAddress: companyAddress,
            companyName: company.name,
            recentPayments: recentPayments
        });
    }

    /**
     * @notice Get total payroll for a company
     * @param _company Company address
     */
    function getTotalPayroll(address _company) 
        public 
        view 
        returns (uint256 total) 
    {
        Company storage company = companies[_company];
        require(company.isActive, "Company not active");
        
        for (uint256 i = 0; i < company.contributorAddresses.length; i++) {
            address contributor = company.contributorAddresses[i];
            if (company.contributors[contributor].isActive) {
                total += company.contributors[contributor].salary;
            }
        }
        return total;
    }

    // Update the deposit function to handle USDe
    function deposit(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(hasRole(COMPANY_ROLE, msg.sender), "Not a company");
        require(amount > 0, "Amount must be > 0");
        Company storage company = companies[msg.sender];
        require(company.isActive, "Company not active");
        
        // Transfer USDe from sender to contract
        usde.safeTransferFrom(msg.sender, address(this), amount);
        company.balance += amount;
        
        emit FundsDeposited(
            msg.sender, 
            amount,
            block.timestamp
        );
    }

    // Add withdraw function for USDe
    function withdraw(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(hasRole(COMPANY_ROLE, msg.sender), "Not a company");
        require(amount > 0, "Amount must be > 0");
        Company storage company = companies[msg.sender];
        require(company.isActive, "Company not active");
        require(company.balance >= amount, "Insufficient balance");
        
        company.balance -= amount;
        usde.safeTransfer(msg.sender, amount);
        
        emit FundsWithdrawn(
            msg.sender, 
            amount,
            block.timestamp
        );
    }

    // Add missing function for total payroll calculation
    function _calculateTotalPayroll(address companyAddress) 
        internal 
        view 
        returns (uint256 total) 
    {
        Company storage company = companies[companyAddress];
        for (uint256 i = 0; i < company.contributorAddresses.length; i++) {
            address contributor = company.contributorAddresses[i];
            if (company.contributors[contributor].isActive) {
                total += company.contributors[contributor].salary;
            }
        }
        return total;
    }

    // Add function to remove contributor
    function removeContributor(address contributorAddress) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(hasRole(COMPANY_ROLE, msg.sender), "Not a company");
        Company storage company = companies[msg.sender];
        require(company.isActive, "Company not active");
        
        Contributor storage contributor = company.contributors[contributorAddress];
        require(contributor.isActive, "Contributor not active");
        
        contributor.isActive = false;
        company.contributorCount--;
        
        // Remove role but keep in array for history
        _revokeRole(CONTRIBUTOR_ROLE, contributorAddress);
        contributorToCompany[contributorAddress] = address(0);
        
        emit ContributorRemoved(
            msg.sender,
            contributorAddress,
            block.timestamp
        );
    }

    // Add function to check if address is contributor
    function isContributor(
        address companyAddress,
        address contributorAddress
    ) 
        external 
        view 
        returns (bool) 
    {
        Company storage company = companies[companyAddress];
        return company.contributors[contributorAddress].isActive;
    }

    // Add function to get next payment info
    function getNextPaymentInfo(
        address companyAddress,
        address contributorAddress
    ) 
        external 
        view 
        returns (
            uint256 nextPayment,
            uint256 amount
        ) 
    {
        Company storage company = companies[companyAddress];
        Contributor storage contributor = company.contributors[contributorAddress];
        require(contributor.isActive, "Contributor not active");
        
        return (
            contributor.nextPayment,
            contributor.salary
        );
    }

    // Add function to pause/unpause company
    function setCompanyStatus(bool status) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(hasRole(COMPANY_ROLE, msg.sender), "Not a company");
        Company storage company = companies[msg.sender];
        company.isActive = status;
    }

    // Update any function that uses getTotalPayroll
    function canProcessPayment(address _company) 
        public 
        view 
        returns (bool) 
    {
        Company storage company = companies[_company];
        if (!company.isActive) return false;
        
        uint256 totalPayroll = getTotalPayroll(_company);
        return company.balance >= totalPayroll;
    }

    // Add helper to check if company has sufficient balance
    function checkCompanyBalance(address _company) 
        external 
        view 
        returns (
            uint256 balance,
            uint256 totalPayroll,
            bool isSufficient
        ) 
    {
        Company storage company = companies[_company];
        require(company.isActive, "Company not active");
        
        totalPayroll = getTotalPayroll(_company);
        balance = company.balance;
        isSufficient = balance >= totalPayroll;
        
        return (balance, totalPayroll, isSufficient);
    }

    // Add function to check if caller is company admin
    function isCompanyAdmin(address companyAddress, address caller) 
        public 
        view 
        returns (bool) 
    {
        return companies[companyAddress].admin == caller;
    }

    // Add modifier for admin-only functions
    modifier onlyCompanyAdmin(address companyAddress) {
        require(isCompanyAdmin(companyAddress, msg.sender), "Not company admin");
        _;
    }
}