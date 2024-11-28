// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPaythenaCore {
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
    }

    // View Functions
    function getActiveCompanies() external view returns (address[] memory);
    function getActiveContributors(address company) external view returns (address[] memory);
    function canProcessPayment(address company) external view returns (bool);
    function isPaymentDue(address company, address contributor) external view returns (bool);
    function getTotalPayroll(address company) external view returns (uint256);
    function getCompanyDetails(address company) external view returns (
        string memory name,
        uint256 balance,
        uint256 contributorCount,
        bool isActive,
        address admin
    );
    function getContributorDetails(
        address company,
        address contributor
    ) external view returns (
        string memory name,
        uint256 salary,
        uint256 nextPayment,
        bool isActive
    );

    // State-Changing Functions
    function processPayment(address contributor) external returns (uint256);
    function registerCompany(string calldata name) external;
    function addContributor(
        address contributor,
        string calldata name,
        uint256 salary,
        uint256 paymentFrequency
    ) external;
    function removeContributor(address contributor) external;
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;

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

    // Add roles
    function CONTRIBUTOR_ROLE() external view returns (bytes32);
    function COMPANY_ROLE() external view returns (bytes32);

    // Add AccessControl function
    function hasRole(bytes32 role, address account) external view returns (bool);
}