// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPaythenaCore {
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

    // Role functions
    function hasRole(bytes32 role, address account) external view returns (bool);
    function getRoleAdmin(bytes32 role) external view returns (bytes32);
    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
    function renounceRole(bytes32 role, address account) external;

    // Role constants
    function COMPANY_ROLE() external view returns (bytes32);
    function CONTRIBUTOR_ROLE() external view returns (bytes32);
    function AUTOMATION_ROLE() external view returns (bytes32);
    function INTEGRATION_ROLE() external view returns (bytes32);

    // Integration functions
    function setAutomationContract(address _automationContract) external;
    function getStakedAmount(address account) external view returns (uint256);
    function getLoanBalance(address account) external view returns (uint256);
    function processPaymentBatch(address[] calldata contributors) external returns (uint256);

    // Events
    event CompanyRegistered(address indexed company, string name, uint256 timestamp);
    event ContributorAdded(address indexed company, address indexed contributor, string name, uint256 salary, uint256 timestamp);
    event ContributorRemoved(address indexed company, address indexed contributor, uint256 timestamp);
    event SalaryProcessed(address indexed company, address indexed contributor, uint256 amount, uint256 timestamp);
    event FundsDeposited(address indexed company, uint256 amount, uint256 timestamp);
    event FundsWithdrawn(address indexed company, uint256 amount, uint256 timestamp);
    event PaymentProcessed(uint256 indexed paymentId, address indexed company, address indexed contributor, uint256 amount, bytes32 txHash, uint256 timestamp);
    event AutomationContractUpdated(address indexed oldContract, address indexed newContract);
    event IntegrationError(string reason, bytes data);

    // Core functions
    function registerCompany(string calldata name) external;
    function addContributor(address contributor, string calldata name, uint256 salary, uint256 paymentFrequency) external;
    function removeContributor(address contributor) external;
    function processSalary(address contributor) external;
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;

    // View functions
    function getCompanyDetails(address company) external view returns (
        string memory name,
        uint256 balance,
        uint256 contributorCount,
        bool isActive,
        address admin
    );

    function getContributorDetails(address company, address contributor) external view returns (
        string memory name,
        uint256 salary,
        uint256 nextPayment,
        uint256 paymentFrequency,
        bool isActive,
        uint256 lastProcessedTime
    );

    function isPaymentDue(address company, address contributor) external view returns (bool);
    function canProcessPayment(address company) external view returns (bool);
    function getActiveCompanies() external view returns (address[] memory);
    function getActiveContributors(address company) external view returns (address[] memory);
    function getTotalPayroll(address company) external view returns (uint256);
}