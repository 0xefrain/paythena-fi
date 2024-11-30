"use client";

import { useCallback, useEffect, useState } from "react";
import { AddContributorModal } from "./modals/AddContributorModal";
import { formatEther } from "viem";
// eslint-disable-next-line prettier/prettier
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { usePaythenaData } from "~~/hooks/scaffold-eth/usePaythenaData";
import { useContributorDetails } from "~~/hooks/useContributorDetails";
import { useWalletState } from "~~/hooks/useWalletState";
import { CompanyDetails } from "~~/types/paythena";
import { notification } from "~~/utils/scaffold-eth";

const copyToClipboard = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => notification.success("Address copied to clipboard!"))
    .catch(() => notification.error("Failed to copy address"));
};

interface ContributorDetail {
  nextPayment: bigint;
  isActive: boolean;
  salary: bigint;
  name: string;
  lastProcessedTime: bigint;
}

const CompanyDashboard = () => {
  const { address, isLoading, isDisconnected, hasLastSession } = useWalletState();
  const [selectedContributor, setSelectedContributor] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [] = useState("");
  const [, setIsProcessing] = useState(false);

  // Use shared data hook with null check for address
  const {
    companyDetails,
    contributors = [],
    contributorDetails,
    refreshData,
  } = usePaythenaData(address || "", selectedContributor) as {
    companyDetails: CompanyDetails;
    contributors: string[];
    contributorDetails: ContributorDetail;
    refreshData: () => Promise<void>;
  };

  // Debug log to check what we're getting
  console.log("Dashboard render:", {
    companyDetails,
    contributors,
    selectedContributor,
    contributorDetails,
  });

  // Contract write functions - move inside component
  useScaffoldWriteContract("PaythenaCore");
  useScaffoldWriteContract("PaythenaCore");
  const { writeContractAsync: removeContributor } = useScaffoldWriteContract("PaythenaCore");
  useScaffoldWriteContract("MockUSDe");
  useScaffoldWriteContract("MockUSDe");

  useDeployedContractInfo("PaythenaCore");

  // Memoize handlers to prevent unnecessary re-renders

  // Early returns with better UX
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="card bg-base-100 shadow-xl p-8">
          <div className="loading loading-spinner loading-lg"></div>
          <h2 className="text-2xl font-bold mt-4">Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (isDisconnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="card bg-base-100 shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome Back!</h2>
          {hasLastSession ? (
            <>
              <p className="mb-4">Please reconnect your wallet to continue.</p>
              <button className="btn btn-primary" onClick={() => document.getElementById("wallet-btn")?.click()}>
                Connect Wallet
              </button>
            </>
          ) : (
            <>
              <p className="mb-4">Please connect your wallet to access the dashboard.</p>
              <button className="btn btn-primary" onClick={() => document.getElementById("wallet-btn")?.click()}>
                Connect Wallet
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!companyDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="card bg-base-100 shadow-xl p-8">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <h2 className="text-2xl font-bold">Loading Company Details...</h2>
          <p className="text-base-content/70 mt-2">Please wait while we fetch your data.</p>
        </div>
      </div>
    );
  }

  // Handle process payroll

  // Add helper function to format time until next payment

  // Handle remove contributor
  const handleRemoveContributor = async (contributorAddress: string) => {
    if (!removeContributor) {
      notification.error("Contract not initialized");
      return;
    }

    setIsProcessing(true);
    try {
      await removeContributor({
        functionName: "removeContributor",
        args: [contributorAddress] as const,
      });

      await refreshData();
      notification.success("Contributor removed successfully");
    } catch (error: any) {
      console.error("Remove contributor error:", error);
      if (error.message.includes("user rejected")) {
        notification.error("Transaction rejected by user");
      } else {
        notification.error("Failed to remove contributor");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Add helper functions for payment status

  // Add function to get total pending payments
  const getPendingPayments = () => {
    if (!contributors || !contributorDetails) return 0;

    const now = BigInt(Math.floor(Date.now() / 1000));
    let count = 0;

    contributors.forEach(() => {
      const nextPayment = contributorDetails.nextPayment as bigint;
      if (nextPayment && now >= nextPayment) count++;
    });

    return count;
  };

  // Add function to process all due payments

  // Add helper function to check if payment is due

  // Add helper function to get contributor details

  // First, add a helper function to get a clear payment overview
  const getPaymentOverview = () => {
    if (!contributors || contributors.length === 0) {
      return {
        status: "No Contributors",
        class: "badge-neutral",
        count: 0,
        nextDue: "No payments scheduled",
      };
    }

    const pendingCount = getPendingPayments();

    if (pendingCount > 0) {
      return {
        status: `${pendingCount} Payment${pendingCount > 1 ? "s" : ""} Due`,
        class: "badge-warning",
        count: pendingCount,
        nextDue: "Payments ready to process",
      };
    }

    // Find next scheduled payment
    let earliestPayment: bigint | null = null;
    contributors.forEach(() => {
      if (contributorDetails?.nextPayment) {
        if (!earliestPayment || contributorDetails.nextPayment < earliestPayment) {
          earliestPayment = contributorDetails.nextPayment;
        }
      }
    });

    if (earliestPayment) {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const timeLeft = Number(earliestPayment - now);
      const days = Math.floor(timeLeft / 86400);
      const hours = Math.floor((timeLeft % 86400) / 3600);

      return {
        status: "All Payments Up to Date",
        class: "badge-success",
        count: 0,
        nextDue: `Next payment in ${days}d ${hours}h`,
      };
    }

    return {
      status: "No Pending Payments",
      class: "badge-success",
      count: 0,
      nextDue: "All payments processed",
    };
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-base-200 min-h-screen">
      {/* Header Section */}
      <header className="bg-base-100 rounded-box p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">{companyDetails.name || "Company Dashboard"}</h1>
            <div className="text-sm breadcrumbs opacity-70">
              <ul>
                <li>Dashboard</li>
                <li>Overview</li>
              </ul>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button className="btn btn-primary btn-sm gap-2" onClick={() => setIsAddModalOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Add Contributor
            </button>
            <button className="btn btn-ghost btn-sm" onClick={refreshData}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="stats bg-base-100 shadow-lg">
          <div className="stat">
            <div className="stat-title flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-primary"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              Balance
            </div>
            <div className="stat-value text-primary">{formatEther(companyDetails.balance)} USDe</div>
          </div>
        </div>

        {/* Contributors Card */}
        <div className="stats bg-base-100 shadow-lg">
          <div className="stat">
            <div className="stat-title flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-secondary"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Contributors
            </div>
            <div className="stat-value">{contributors.length}</div>
          </div>
        </div>

        {/* Payment Overview Card */}
        <div className="stats bg-base-100 shadow-lg">
          <div className="stat">
            <div className="stat-title flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-accent"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              Payment Overview
            </div>
            <div className="stat-value">
              <span className={`badge ${getPaymentOverview().class}`}>{getPaymentOverview().status}</span>
            </div>
          </div>
        </div>

        {/* Company Status Card */}
        <div className="stats bg-base-100 shadow-lg">
          <div className="stat">
            <div className="stat-title flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-info"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                  clipRule="evenodd"
                />
              </svg>
              Company Status
            </div>
            <div className="stat-value">
              <span className={`badge ${companyDetails.isActive ? "badge-success" : "badge-error"}`}>
                {companyDetails.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Contributors Table */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Contributors ({contributors?.length || 0})</h2>
              <div className="flex gap-2">
                <div className="join">
                  <input
                    type="text"
                    placeholder="Search contributors..."
                    className="input input-bordered input-sm join-item"
                  />
                  <button className="btn btn-sm join-item">Search</button>
                </div>
              </div>
            </div>

            {/* Contributors Table */}
            <div className="overflow-x-auto">
              {contributors?.length > 0 ? (
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Contributor</th>
                      <th>Salary</th>
                      <th>Status</th>
                      <th>Payment Info</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributors.map(contributor => (
                      <ContributorDetails
                        key={contributor}
                        address={address}
                        contributorAddress={contributor}
                        onRemove={handleRemoveContributor}
                        selectedContributor={selectedContributor}
                        onSelectContributor={setSelectedContributor}
                        refreshData={refreshData}
                        companyDetails={companyDetails}
                      />
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-base-content/70">No contributors found</p>
                  <button className="btn btn-primary btn-sm mt-2" onClick={() => setIsAddModalOpen(true)}>
                    Add your first contributor
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddContributorModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={refreshData} />
    </div>
  );
};

// Create a separate component for payment countdown
const PaymentCountdown = ({ nextPayment }: { nextPayment: bigint | undefined }) => {
  const [timeToNextPayment, setTimeToNextPayment] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => {
      if (nextPayment) {
        const now = BigInt(Math.floor(Date.now() / 1000));
        const timeLeft = Number(nextPayment - now);

        if (timeLeft <= 0) {
          setTimeToNextPayment("Payment Due");
        } else {
          const hours = Math.floor(timeLeft / 3600);
          const minutes = Math.floor((timeLeft % 3600) / 60);
          const seconds = timeLeft % 60;
          setTimeToNextPayment(`${hours}h ${minutes}m ${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextPayment]);

  return <span>{timeToNextPayment || "Loading..."}</span>;
};

// Update ContributorBalanceMonitor to use the countdown component
const ContributorBalanceMonitor = ({
  contributorAddress,
  nextPayment,
}: {
  contributorAddress: string;
  nextPayment: bigint | undefined;
}) => {
  const { data: contributorBalance } = useScaffoldReadContract({
    contractName: "MockUSDe",
    functionName: "balanceOf",
    args: [contributorAddress],
  });

  const [lastCheckedBalance, setLastCheckedBalance] = useState<bigint>(BigInt(0));

  useEffect(() => {
    const balance = contributorBalance ? BigInt(contributorBalance.toString()) : BigInt(0);
    if (balance > lastCheckedBalance) {
      notification.success(`Payment received: ${formatEther(balance - lastCheckedBalance)} USDe`);
      setLastCheckedBalance(balance);
    }
  }, [contributorBalance, lastCheckedBalance]);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium">
        Balance: {formatEther(BigInt(contributorBalance?.toString() || "0"))} USDe
      </span>
      <span className="text-xs">
        Next Payment: <PaymentCountdown nextPayment={nextPayment} />
      </span>
    </div>
  );
};

// Update the ContributorDetails component to pass nextPayment
const ContributorDetails = ({
  address,
  contributorAddress,
  onRemove,
  selectedContributor,
  onSelectContributor,
  refreshData,
  companyDetails,
}: {
  address: string | undefined;
  contributorAddress: string;
  onRemove: (address: string) => void;
  selectedContributor: string;
  onSelectContributor: (address: string) => void;
  refreshData: () => Promise<void>;
  companyDetails: CompanyDetails;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded] = useState(false);

  // Add contract write hook
  const { writeContractAsync: processPayroll } = useScaffoldWriteContract("PaythenaCore");

  // Use the custom hook
  const details = useContributorDetails(address, contributorAddress);

  // Get payment history
  const { data: paymentHistory } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getPaymentHistory",
    args: [address as string, contributorAddress],
  });

  // Move getTimeUntilNextPayment before it's used
  const getTimeUntilNextPayment = useCallback(() => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const timeLeftBigInt = details?.nextPayment - now;
    const timeLeftNumber = Number(timeLeftBigInt);

    if (timeLeftNumber <= 0) return "Payment Due";

    const days = Math.floor(timeLeftNumber / 86400);
    const hours = Math.floor((timeLeftNumber % 86400) / 3600);
    const minutes = Math.floor((timeLeftNumber % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }, [details?.nextPayment]);

  // Helper functions
  const canProcessPayment = useCallback(() => {
    const companyBalance = companyDetails?.balance || BigInt(0);
    const now = BigInt(Math.floor(Date.now() / 1000));
    const nextPaymentTime = BigInt(details?.nextPayment || 0);
    return details?.isActive && companyBalance >= details.salary && now >= nextPaymentTime;
  }, [companyDetails?.balance, details?.isActive, details?.salary, details?.nextPayment]);

  const isDue = useCallback(() => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const nextPaymentTime = BigInt(details?.nextPayment || 0);
    return details?.isActive && now >= nextPaymentTime;
  }, [details?.isActive, details?.nextPayment]);

  const handleProcessPayment = useCallback(async () => {
    if (!canProcessPayment()) {
      if (companyDetails?.balance < details?.salary) {
        notification.error("Insufficient balance for payment");
      } else if (!isDue()) {
        notification.error(`Payment not due yet. Next payment in ${getTimeUntilNextPayment()}`);
      }
      return;
    }

    setIsProcessing(true);
    try {
      await processPayroll({
        functionName: "processSalary",
        args: [contributorAddress] as const,
      });

      await refreshData();
      notification.success("Payment processed successfully");
    } catch (error: any) {
      console.error("Process payment error:", error);
      if (error.message.includes("PaymentAlreadyProcessed")) {
        notification.error(`Payment not due yet. Next payment in ${getTimeUntilNextPayment()}`);
      } else if (error.message.includes("InsufficientBalance")) {
        notification.error("Insufficient balance for payment");
      } else if (error.message.includes("user rejected")) {
        notification.error("Transaction rejected by user");
      } else {
        notification.error("Failed to process payment. Check console for details.");
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    canProcessPayment,
    processPayroll,
    contributorAddress,
    refreshData,
    companyDetails?.balance,
    details?.salary,
    isDue,
    getTimeUntilNextPayment,
  ]);

  const handleRemove = useCallback(async () => {
    // Add confirmation dialog with null check for details
    if (!window.confirm(`Are you sure you want to remove ${details?.name || contributorAddress}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await onRemove(contributorAddress);
    } finally {
      setIsProcessing(false);
    }
  }, [contributorAddress, onRemove, details?.name]);

  // Loading state
  if (!details) {
    return (
      <tr>
        <td colSpan={7} className="text-center">
          <span className="loading loading-spinner loading-sm"></span>
        </td>
      </tr>
    );
  }

  const getPaymentStatus = () => {
    const now = BigInt(Math.floor(Date.now() / 1000));

    if (!details.isActive) return { text: "Inactive", class: "badge-error" };
    if (now >= details.nextPayment) return { text: "Payment Due", class: "badge-warning" };
    if (details.lastProcessedTime === BigInt(0)) return { text: "Never Paid", class: "badge-warning" };
    return { text: "Active", class: "badge-success" };
  };

  const status = getPaymentStatus();

  // Add function to format date nicely
  const formatDate = (timestamp: bigint | number) => {
    const date = new Date(Number(timestamp) * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today at " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday at " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Add function to get latest payment

  // Get latest payment

  return (
    <>
      <tr
        className={`hover:bg-base-200 transition-colors ${selectedContributor === contributorAddress ? "bg-primary/5" : ""}`}
      >
        <td>
          <input
            type="radio"
            className="radio"
            checked={selectedContributor === contributorAddress}
            onChange={() => onSelectContributor(contributorAddress)}
          />
        </td>
        <td>
          <div className="flex flex-col gap-1">
            <span className="font-medium">{details?.name || contributorAddress}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-60 truncate max-w-[150px]">{contributorAddress}</span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => copyToClipboard(contributorAddress)}
                title="Copy address"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
          </div>
        </td>
        <td>
          <div className="flex flex-col">
            <span className="font-mono">{formatEther(details?.salary || BigInt(0))} USDe</span>
            <span className="text-xs opacity-60">Every {Number(details?.paymentFrequency || 0) / 86400} days</span>
          </div>
        </td>
        <td>
          <div className="flex flex-col gap-2">
            {/* Payment Status */}
            <div className="flex items-center gap-2">
              <span className={`badge badge-sm ${status.class}`}>{status.text}</span>
              {isDue() && <span className="badge badge-sm badge-warning">Payment Due</span>}
            </div>

            {/* Payment Timing */}
            <div className="text-xs">
              {isDue() ? (
                <span className="text-warning font-medium">Payment is ready to process</span>
              ) : (
                <span>Next payment in: {getTimeUntilNextPayment()}</span>
              )}
            </div>

            {/* Payment Actions */}
            <div className="flex gap-2">
              {isDue() ? (
                <button
                  className={`btn btn-sm btn-warning ${isProcessing ? "loading" : ""}`}
                  onClick={handleProcessPayment}
                  disabled={isProcessing || !canProcessPayment()}
                >
                  <div className="flex items-center gap-1">
                    {isProcessing ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 1h6v2H7V6zm6 7H7v2h6v-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Process Payment</span>
                      </>
                    )}
                  </div>
                </button>
              ) : (
                <div className="tooltip" data-tip={`Next payment in ${getTimeUntilNextPayment()}`}>
                  <button className="btn btn-sm btn-disabled opacity-50">Scheduled</button>
                </div>
              )}
            </div>

            {/* Payment Error Message */}
            {!canProcessPayment() && isDue() && (
              <div className="text-error text-xs flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Insufficient balance for payment</span>
              </div>
            )}

            {/* Payment Amount */}
            <div className="text-xs opacity-70">Amount: {formatEther(details?.salary || BigInt(0))} USDe</div>
          </div>
        </td>
        <td>
          <div className="flex gap-2">
            {isDue() && (
              <button
                className={`btn btn-sm btn-warning ${isProcessing ? "loading" : ""}`}
                onClick={handleProcessPayment}
                disabled={isProcessing || !canProcessPayment()}
                title={!canProcessPayment() ? "Insufficient balance" : ""}
              >
                Pay Now
              </button>
            )}
            <button
              className={`btn btn-sm btn-error ${isProcessing ? "loading" : ""}`}
              onClick={handleRemove}
              disabled={isProcessing}
            >
              Remove
            </button>
          </div>
          {!canProcessPayment() && isDue() && (
            <div className="text-error text-xs mt-1">Insufficient balance for payment</div>
          )}
        </td>
        <td>
          <ContributorBalanceMonitor contributorAddress={contributorAddress} nextPayment={details?.nextPayment} />
        </td>
      </tr>
      {isExpanded && paymentHistory && Array.isArray(paymentHistory) && paymentHistory.length > 0 && (
        <tr>
          <td colSpan={6}>
            <div className="bg-base-200 p-4 rounded-lg">
              <h4 className="font-bold mb-2">Payment History</h4>
              <div className="overflow-x-auto">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...paymentHistory]
                      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                      .map(payment => (
                        <tr key={payment.paymentId.toString()}>
                          <td>{formatDate(payment.timestamp)}</td>
                          <td className="font-mono">{formatEther(payment.amount)} USDe</td>
                          <td>
                            <span className={`badge badge-sm ${payment.processed ? "badge-success" : "badge-warning"}`}>
                              {payment.processed ? "Processed" : "Pending"}
                            </span>
                          </td>
                          <td>
                            <a
                              href={`https://sepolia.etherscan.io/tx/${payment.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-primary text-xs"
                            >
                              View Transaction
                            </a>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default CompanyDashboard;
