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
 * @title PaythenaLoan
 * @notice Manages salary-backed loans for contributors
 * @custom:security-contact security@paythena.com
 */
contract PaythenaLoan is ReentrancyGuard, AccessControl, Pausable {
    using SafeERC20 for IERC20;
    using Address for address;

    // Roles
    bytes32 public constant LOAN_MANAGER_ROLE = keccak256("LOAN_MANAGER_ROLE");
    
    // State variables
    IERC20 public immutable usde;
    IPaythenaCore public immutable coreContract;

    // Constants with explicit visibility
    uint256 public constant MIN_LOAN_DURATION = 30 days;
    uint256 public constant MAX_LOAN_DURATION = 365 days;
    uint256 public constant MAX_LOAN_TO_SALARY_RATIO = 300; // 300% of monthly salary
    uint256 public constant INTEREST_RATE_BASE = 10000; // 100.00%
    uint256 public constant DEFAULT_INTEREST_RATE = 500; // 5.00%
    uint256 public constant LATE_PAYMENT_PENALTY = 100; // 1.00%
    uint256 public constant GRACE_PERIOD = 3 days;

    // Updated structs with better organization
    struct Loan {
        uint256 amount;
        uint256 totalDue;
        uint256 monthlyPayment;
        uint256 startDate;
        uint256 dueDate;
        uint256 lastPaymentDate;
        uint256 remainingAmount;
        uint256 interestRate;
        LoanStatus status;
        bytes32 purposeHash;
    }

    struct LoanApplication {
        uint256 requestedAmount;
        uint256 duration;
        string purpose;
        uint256 timestamp;
        LoanStatus status;
    }

    enum LoanStatus {
        None,
        Pending,
        Approved,
        Active,
        Completed,
        Defaulted,
        Rejected
    }

    // Mappings with explicit visibility
    mapping(address => Loan) public loans;
    mapping(address => LoanApplication) public loanApplications;
    mapping(address => uint256) public totalLoansIssued;
    mapping(address => uint256) public creditScore;

    // Events
    event LoanRequested(
        address indexed borrower,
        uint256 amount,
        uint256 duration,
        string purpose,
        uint256 timestamp
    );
    
    event LoanApproved(
        address indexed borrower,
        uint256 amount,
        uint256 duration,
        uint256 interestRate
    );
    
    event LoanCompleted(
        address indexed borrower,
        uint256 totalPaid
    );
    
    event PaymentMade(
        address indexed borrower,
        uint256 amount,
        uint256 remainingBalance
    );
    
    event LoanDefaulted(
        address indexed borrower,
        uint256 remainingAmount
    );
    
    event CreditScoreUpdated(
        address indexed borrower,
        uint256 newScore
    );

    struct RepaymentSchedule {
        uint256 amount;
        uint256 frequency;
        uint256 nextPaymentDate;
        uint256 remainingPayments;
        bool isActive;
    }

    mapping(address => RepaymentSchedule) public repaymentSchedules;

    event RepaymentScheduleCreated(
        address indexed borrower,
        uint256 amount,
        uint256 frequency,
        uint256 totalPayments
    );

    event AutomatedRepaymentProcessed(
        address indexed borrower,
        uint256 amount,
        uint256 remainingBalance,
        uint256 timestamp
    );

    /**
     * @notice Contract constructor
     * @param _core Address of PaythenaCore contract
     * @param _usde Address of USDe token
     */
    constructor(
        address _usde,
        address _core
    ) {
        require(_usde != address(0), "Invalid USDe address");
        require(_core != address(0), "Invalid core address");
        require(_core.code.length == 0, "Core must be EOA");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(LOAN_MANAGER_ROLE, msg.sender);
        
        usde = IERC20(_usde);
        coreContract = IPaythenaCore(_core);
    }

    /**
     * @notice Request a loan
     * @param amount Requested loan amount
     * @param duration Loan duration in seconds
     * @param purpose Purpose of the loan
     */
    function requestLoan(
        uint256 amount,
        uint256 duration,
        string calldata purpose
    ) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        bytes32 contributorRole = coreContract.CONTRIBUTOR_ROLE();
        require(
            coreContract.hasRole(contributorRole, msg.sender),
            "Not a contributor"
        );
        require(amount > 0, "Invalid amount");
        require(duration <= MAX_LOAN_DURATION, "Duration too long");
        require(bytes(purpose).length > 0, "Purpose required");
        require(loans[msg.sender].status == LoanStatus.None, "Active loan exists");

        emit LoanRequested(
            msg.sender,
            amount,
            duration,
            purpose,
            block.timestamp
        );
    }

    /**
     * @notice Approve a loan application
     * @param borrower Address of the borrower
     * @param customInterestRate Optional custom interest rate
     */
    function approveLoan(address borrower, uint256 customInterestRate) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not admin");
        require(loanApplications[borrower].status == LoanStatus.Pending, "Not pending");

        LoanApplication storage application = loanApplications[borrower];
        uint256 interestRate = customInterestRate > 0 ? customInterestRate : DEFAULT_INTEREST_RATE;
        
        uint256 totalAmount = _calculateTotalAmount(
            application.requestedAmount,
            interestRate,
            application.duration
        );
        
        uint256 monthlyPayment = totalAmount / (application.duration / 30 days);

        loans[borrower] = Loan({
            amount: application.requestedAmount,
            totalDue: totalAmount,
            monthlyPayment: monthlyPayment,
            startDate: block.timestamp,
            dueDate: block.timestamp + application.duration,
            lastPaymentDate: block.timestamp,
            remainingAmount: totalAmount,
            interestRate: interestRate,
            status: LoanStatus.Active,
            purposeHash: keccak256(bytes(application.purpose))
        });

        // Transfer loan amount
        usde.safeTransfer(borrower, application.requestedAmount);
        
        totalLoansIssued[borrower] += application.requestedAmount;
        delete loanApplications[borrower];

        emit LoanApproved(
            borrower,
            application.requestedAmount,
            block.timestamp + application.duration,
            interestRate
        );
    }

    /**
     * @notice Make a loan payment
     * @param amount Payment amount
     */
    function makePayment(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        Loan storage loan = loans[msg.sender];
        require(loan.status == LoanStatus.Active, "No active loan");
        require(amount > 0, "Zero amount");

        // Calculate late payment penalties
        uint256 totalDue = loan.remainingAmount;
        if (block.timestamp > loan.lastPaymentDate + 30 days + GRACE_PERIOD) {
            uint256 penalty = (totalDue * LATE_PAYMENT_PENALTY) / INTEREST_RATE_BASE;
            totalDue += penalty;
        }

        require(amount <= totalDue, "Amount exceeds due");

        // Transfer payment
        usde.safeTransferFrom(msg.sender, address(this), amount);
        
        loan.remainingAmount -= amount;
        loan.lastPaymentDate = block.timestamp;

        if (loan.remainingAmount == 0) {
            loan.status = LoanStatus.Completed;
            _updateCreditScore(msg.sender, true);
            emit LoanCompleted(msg.sender, loan.totalDue);
        } else {
            emit PaymentMade(msg.sender, amount, loan.remainingAmount);
        }
    }

    /**
     * @notice Check for and mark defaulted loans
     * @param borrower Address of the borrower
     */
    function checkLoanDefault(address borrower) 
        external 
        nonReentrant 
    {
        Loan storage loan = loans[borrower];
        require(loan.status == LoanStatus.Active, "Not active loan");

        if (block.timestamp > loan.dueDate + GRACE_PERIOD) {
            loan.status = LoanStatus.Defaulted;
            _updateCreditScore(borrower, false);
            emit LoanDefaulted(borrower, loan.remainingAmount);
        }
    }

    /**
     * @notice Calculate total amount including interest
     * @param principal Principal amount
     * @param interestRate Annual interest rate
     * @param duration Loan duration
     */
    function _calculateTotalAmount(
        uint256 principal,
        uint256 interestRate,
        uint256 duration
    ) 
        internal 
        pure 
        returns (uint256) 
    {
        uint256 interest = (principal * interestRate * duration) / (INTEREST_RATE_BASE * 365 days);
        return principal + interest;
    }

    /**
     * @notice Update borrower's credit score
     * @param borrower Address of the borrower
     * @param positive Whether the update is positive or negative
     */
    function _updateCreditScore(address borrower, bool positive) 
        internal 
    {
        uint256 currentScore = creditScore[borrower];
        if (positive) {
            creditScore[borrower] = currentScore < 950 ? currentScore + 50 : 1000;
        } else {
            creditScore[borrower] = currentScore > 100 ? currentScore - 100 : 0;
        }
        emit CreditScoreUpdated(borrower, creditScore[borrower]);
    }

    /**
     * @notice Get loan details
     * @param borrower Address of the borrower
     */
    function getLoanDetails(address borrower)
        external
        view
        returns (
            uint256 amount,
            uint256 totalDue,
            uint256 monthlyPayment,
            uint256 remainingAmount,
            uint256 nextPaymentDue,
            LoanStatus status
        )
    {
        Loan storage loan = loans[borrower];
        return (
            loan.amount,
            loan.totalDue,
            loan.monthlyPayment,
            loan.remainingAmount,
            loan.lastPaymentDate + 30 days,
            loan.status
        );
    }

    /**
     * @notice Emergency pause
     * @dev Only callable by admin
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Emergency unpause
     * @dev Only callable by admin
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Set up automated repayment schedule
     * @param frequency Repayment frequency in seconds
     * @param startDate Start date for repayments
     */
    function setupAutomatedRepayment(
        uint256 frequency,
        uint256 startDate
    ) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        Loan storage loan = loans[msg.sender];
        require(loan.status == LoanStatus.Active, "No active loan");
        require(frequency >= 1 days, "Frequency too short");
        require(startDate > block.timestamp, "Invalid start date");

        uint256 monthlyPayment = _calculateMonthlyPayment(
            loan.remainingAmount,
            loan.interestRate,
            loan.dueDate
        );

        repaymentSchedules[msg.sender] = RepaymentSchedule({
            amount: monthlyPayment,
            frequency: frequency,
            nextPaymentDate: startDate,
            remainingPayments: loan.remainingAmount / monthlyPayment,
            isActive: true
        });

        emit RepaymentScheduleCreated(
            msg.sender,
            monthlyPayment,
            frequency,
            loan.remainingAmount / monthlyPayment
        );
    }

    /**
     * @notice Process automated repayment
     * @param borrower Address of the borrower
     */
    function processAutomatedRepayment(address borrower) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (bool)
    {
        RepaymentSchedule storage schedule = repaymentSchedules[borrower];
        require(schedule.isActive, "No active schedule");
        require(block.timestamp >= schedule.nextPaymentDate, "Payment not due");

        Loan storage loan = loans[borrower];
        require(loan.status == LoanStatus.Active, "Loan not active");

        // Process payment
        bool success = _processRepayment(borrower, schedule.amount);
        if (success) {
            schedule.nextPaymentDate += schedule.frequency;
            schedule.remainingPayments--;

            if (loan.remainingAmount == 0) {
                schedule.isActive = false;
            }

            emit AutomatedRepaymentProcessed(
                borrower,
                schedule.amount,
                loan.remainingAmount,
                block.timestamp
            );
        }

        return success;
    }

    /**
     * @notice Check if repayment is needed
     * @param borrower Address of the borrower
     */
    function checkRepaymentNeeded(address borrower) 
        external 
        view 
        returns (bool needed, uint256 amount) 
    {
        RepaymentSchedule storage schedule = repaymentSchedules[borrower];
        if (!schedule.isActive) return (false, 0);
        if (block.timestamp < schedule.nextPaymentDate) return (false, 0);

        return (true, schedule.amount);
    }

    /**
     * @notice Cancel automated repayment schedule
     */
    function cancelAutomatedRepayment() 
        external 
        nonReentrant 
    {
        RepaymentSchedule storage schedule = repaymentSchedules[msg.sender];
        require(schedule.isActive, "No active schedule");
        
        schedule.isActive = false;
    }

    /**
     * @notice Get repayment schedule details
     * @param borrower Address of the borrower
     */
    function getRepaymentSchedule(address borrower)
        external
        view
        returns (
            uint256 amount,
            uint256 frequency,
            uint256 nextPaymentDate,
            uint256 remainingPayments,
            bool isActive
        )
    {
        RepaymentSchedule storage schedule = repaymentSchedules[borrower];
        return (
            schedule.amount,
            schedule.frequency,
            schedule.nextPaymentDate,
            schedule.remainingPayments,
            schedule.isActive
        );
    }

    /**
     * @notice Calculate monthly payment for a loan
     * @param principal Loan amount
     * @param interestRate Annual interest rate
     * @param dueDate Loan due date
     */
    function _calculateMonthlyPayment(
        uint256 principal,
        uint256 interestRate,
        uint256 dueDate
    ) 
        internal 
        view 
        returns (uint256) 
    {
        uint256 duration = dueDate - block.timestamp;
        uint256 months = duration / 30 days;
        if (months == 0) return principal;
        
        uint256 monthlyInterest = (principal * interestRate) / 
            (INTEREST_RATE_BASE * 12);
        
        return (principal / months) + monthlyInterest;
    }

    /**
     * @notice Process a loan repayment
     * @param borrower Address of the borrower
     * @param amount Amount to repay
     */
    function _processRepayment(
        address borrower,
        uint256 amount
    ) 
        internal 
        returns (bool) 
    {
        Loan storage loan = loans[borrower];
        require(loan.status == LoanStatus.Active, "Loan not active");
        require(amount > 0, "Invalid amount");

        // Transfer payment
        try usde.transferFrom(borrower, address(this), amount) {
            loan.remainingAmount = loan.remainingAmount > amount ? 
                loan.remainingAmount - amount : 0;
            
            if (loan.remainingAmount == 0) {
                loan.status = LoanStatus.Completed;
                emit LoanCompleted(borrower, loan.totalDue);
            } else {
                emit PaymentMade(borrower, amount, loan.remainingAmount);
            }
            
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @notice Check if an account is a contributor
     * @param account Address of the account
     */
    function _isContributor(address account) internal view returns (bool) {
        bytes32 contributorRole = coreContract.CONTRIBUTOR_ROLE();
        return coreContract.hasRole(contributorRole, account);
    }
}