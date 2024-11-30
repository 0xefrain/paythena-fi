// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Export the enum so it can be imported
enum LoanStatus { 
    None,
    Pending,
    Approved,
    Active,
    Completed,
    Defaulted,
    Rejected
}

interface IPaythenaLoan {
    // Use the enum in the interface
    function getLoanDetails(address borrower) external view returns (
        uint256 amount,
        uint256 totalDue,
        uint256 monthlyPayment,
        uint256 remainingAmount,
        uint256 nextPaymentDue,
        LoanStatus status
    );
    
    // Events
    event LoanRequested(address indexed borrower, uint256 amount, uint256 duration, string purpose, uint256 timestamp);
    event LoanApproved(address indexed borrower, uint256 amount, uint256 duration, uint256 interestRate);
    event LoanCompleted(address indexed borrower, uint256 totalPaid);
    event PaymentMade(address indexed borrower, uint256 amount, uint256 remainingBalance);
    event LoanDefaulted(address indexed borrower, uint256 remainingAmount);
    event CreditScoreUpdated(address indexed borrower, uint256 newScore);

    // Core functions
    function requestLoan(uint256 amount, uint256 duration, string calldata purpose) external;
    function approveLoan(address borrower, uint256 interestRate) external;
    function makePayment(uint256 amount) external;
    function checkLoanDefault(address borrower) external;

    // View functions
    function getLoanBalance(address account) external view returns (uint256);
    function getCreditScore(address borrower) external view returns (uint256);
    function paused() external view returns (bool);
}