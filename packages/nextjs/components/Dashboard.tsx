"use client";

import { useState } from "react";
import { AddContributorModal } from "./modals/AddContributorModal";
import { ConfigureSalaryModal } from "./modals/ConfigureSalaryModal";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import Link from "next/link";

interface ContributorDebugInfo {
  name: string;
  salary: bigint;
  isActive: boolean;
  exists: boolean;
  companyActive: boolean;
  paymentFrequency: bigint;
  nextPayment: bigint;
  lastPayment: bigint;
  contributorCount: bigint;
  isCompanyRole: boolean;
  isContributorRole: boolean;
}

interface CompanyDetails {
  0: string; // name
  1: bigint; // balance
  2: bigint; // contributors count
  3: boolean; // isActive
}

interface PaymentRecord {
  paymentId: bigint;
  txHash: string;
  timestamp: bigint;
  amount: bigint;
  processed: boolean;
}

const getTimeUntilPayment = (nextPayment: bigint) => {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const timeLeft = Number(nextPayment - now);

  if (timeLeft <= 0) return "Payment is due";

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
};

const useRefreshData = (address: string | undefined, selectedContributor: string) => {
  const { refetch: refetchCompany } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getCompanyDetails",
    args: [address],
  });

  const { refetch: refetchContributors } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getContributorAddresses",
    args: [address],
  });

  const { refetch: refetchAutomation } = useScaffoldReadContract({
    contractName: "PaythenaAutomation",
    functionName: "automatedCompanies",
    args: [address],
  });

  const { refetch: refetchSelectedContributor } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "debugContributor",
    args: [address as string, selectedContributor],
  });

  return async (setRefreshKey?: React.Dispatch<React.SetStateAction<number>>) => {
    try {
      await Promise.all([
        refetchCompany(),
        refetchContributors(),
        refetchAutomation(),
        refetchSelectedContributor(),
      ]);
      
      // Only update refresh key if the setter is provided
      if (setRefreshKey) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error("Refresh error:", error);
      throw error;
    }
  };
};

const getPaymentStatus = (contributor: ContributorDebugInfo) => {
  if (!contributor.isActive) return { status: "Inactive", class: "badge-error" };

  const now = BigInt(Math.floor(Date.now() / 1000));

  try {
    // Add debug logging
    console.log("Payment Status Debug:", {
      lastPayment: contributor.lastPayment?.toString(),
      nextPayment: contributor.nextPayment?.toString(),
      now: now.toString(),
      isActive: contributor.isActive,
    });

    // Check if payment was ever made
    if (!contributor.lastPayment || contributor.lastPayment === BigInt(0)) {
      return { status: "Never Paid", class: "badge-warning" };
    }

    // Check if next payment is due
    if (now >= contributor.nextPayment) {
      return { status: "Payment Due", class: "badge-warning" };
    }

    // If we got here, payment was made and next payment isn't due yet
    return { status: "Paid", class: "badge-success" };
  } catch (error) {
    console.error("Error in getPaymentStatus:", error);
    return { status: "Error", class: "badge-error" };
  }
};

const ContributorDetails = ({
  address,
  contributorAddress,
  onRemove,
  onConfigureSalary,
  selectedContributor,
  onSelectContributor,
  refreshData,
}: {
  address: string | undefined;
  contributorAddress: string;
  onRemove: (address: string) => void;
  onConfigureSalary: (address: string) => void;
  selectedContributor: string;
  onSelectContributor: (address: string) => void;
  refreshData: () => Promise<void>;
}) => {
  const { data: contributor } = useScaffoldReadContract<"PaythenaCore", "debugContributor">({
    contractName: "PaythenaCore",
    functionName: "debugContributor",
    args: [address as string, contributorAddress],
  }) as { data: ContributorDebugInfo | undefined };

  const { data: paymentHistory, refetch: refetchPaymentHistory } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getPaymentHistory",
    args: [address, contributorAddress],
  }) as { data: PaymentRecord[] | undefined, refetch: () => Promise<any> };

  // Debug logging
  console.log("Debug contributor:", {
    company: address,
    contributor: contributorAddress,
    data: contributor,
  });

  if (!contributor) {
    return (
      <tr>
        <td colSpan={6} className="text-center">
          <span className="loading loading-spinner loading-sm"></span>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`hover:bg-base-200 transition-colors ${selectedContributor === contributorAddress ? "bg-primary/5" : ""}`}>
      <td>
        <input
          type="radio"
          name="selectedContributor"
          checked={selectedContributor === contributorAddress}
          onChange={() => onSelectContributor(contributorAddress)}
          className="radio radio-primary"
        />
      </td>
      <td className="font-medium">{contributor.name || "N/A"}</td>
      <td>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono">{contributorAddress.slice(0, 6)}...{contributorAddress.slice(-4)}</span>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => navigator.clipboard.writeText(contributorAddress)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
          </button>
        </div>
      </td>
      <td>
        <div className="font-mono">{contributor.salary ? formatEther(contributor.salary) : "0"} USDe</div>
      </td>
      <td>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs">Frequency:</span>
            <span className="badge badge-sm">
              {contributor.paymentFrequency ? Math.floor(Number(contributor.paymentFrequency) / 86400) : 0} days
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">Last Payment:</span>
            <span className="badge badge-sm">
              {contributor.lastPayment ? new Date(Number(contributor.lastPayment) * 1000).toLocaleDateString() : "Never"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">Next Payment:</span>
            <span className="badge badge-sm">
              {contributor.nextPayment ? getTimeUntilPayment(contributor.nextPayment) : "N/A"}
            </span>
          </div>
          {paymentHistory && paymentHistory.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs">Latest TX:</span>
              <a
                href={`https://sepolia.etherscan.io/tx/${paymentHistory[paymentHistory.length - 1].txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:opacity-80 truncate max-w-[100px]"
              >
                {paymentHistory[paymentHistory.length - 1].txHash.slice(0, 6)}...
                {paymentHistory[paymentHistory.length - 1].txHash.slice(-4)}
              </a>
            </div>
          )}
        </div>
      </td>
      <td>
        <div className="flex flex-col gap-2 min-w-[120px]">
          <span className={`badge badge-sm ${contributor.isActive ? "badge-success" : "badge-error"} whitespace-nowrap`}>
            {contributor.isActive ? "Active" : "Inactive"}
          </span>
          <span className={`badge badge-sm ${getPaymentStatus(contributor).class} whitespace-nowrap`}>
            {getPaymentStatus(contributor).status}
          </span>
        </div>
      </td>
      <td>
        <div className="flex flex-col gap-2">
          <button
            className="btn btn-xs btn-primary"
            onClick={() => onConfigureSalary(contributorAddress)}
            disabled={!contributor.exists}
          >
            Configure
          </button>
          <button
            className="btn btn-xs btn-error"
            onClick={() => onRemove(contributorAddress)}
            disabled={!contributor.exists}
          >
            Remove
          </button>
        </div>
      </td>
    </tr>
  );
};

export const CompanyDashboard = () => {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Read company data
  const { data: companyDetails } = useScaffoldReadContract<"PaythenaCore", string>({
    contractName: "PaythenaCore",
    functionName: "getCompanyDetails",
    args: [address],
  }) as { data: CompanyDetails | undefined };

  // First approve USDe spending
  const { writeContractAsync: approveUSDe } = useScaffoldWriteContract("MockUSDe");

  // Then deposit to PaythenaCore
  const { writeContractAsync: depositFunds } = useScaffoldWriteContract("PaythenaCore");

  // Get PaythenaCore contract info
  const { data: paythenaContract } = useDeployedContractInfo("PaythenaCore");

  // Add mint function for USDe
  const { writeContractAsync: mintUsde } = useScaffoldWriteContract("MockUSDe");

  // Add contract write hooks
  const { writeContractAsync: processPayroll } = useScaffoldWriteContract("PaythenaCore");
  const { writeContractAsync: pauseCompany } = useScaffoldWriteContract("PaythenaCore");

  // Update the contributor addresses hook
  const { data: contributorAddresses } = useScaffoldReadContract<"PaythenaCore", "getContributorAddresses">({
    contractName: "PaythenaCore",
    functionName: "getContributorAddresses",
    args: [address],
  }) as { data: string[] | undefined };

  // Add remove contributor function
  const { writeContractAsync: removeContributor } = useScaffoldWriteContract("PaythenaCore");

  const { data: selectedContributorData } = useScaffoldReadContract<"PaythenaCore", "debugContributor">({
    contractName: "PaythenaCore",
    functionName: "debugContributor",
    args: [address as string, selectedContributor],
  }) as { data: ContributorDebugInfo | undefined };

  // Add this button next to Process Payroll
  const { writeContractAsync: updateNextPayment } = useScaffoldWriteContract("PaythenaCore");

  // Add refresh function
  const refreshData = useRefreshData(address, selectedContributor);

  const { writeContractAsync: enableAutomation } = useScaffoldWriteContract("PaythenaAutomation");
  const { writeContractAsync: disableAutomation } = useScaffoldWriteContract("PaythenaAutomation");

  const { data: isAutomated, refetch: refetchAutomation } = useScaffoldReadContract({
    contractName: "PaythenaAutomation",
    functionName: "automatedCompanies",
    args: [address],
  });

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      notification.error("Please enter a valid amount");
      return;
    }

    if (!paythenaContract?.address) {
      notification.error("Contract not found");
      return;
    }

    if (!companyDetails?.[3]) {
      // Check if company is active
      notification.error("Company is not active");
      return;
    }

    setIsDepositing(true);
    try {
      const parsedAmount = parseEther(amount);

      // Debug logs
      console.log("Deposit details:", {
        amount: parsedAmount.toString(),
        paythenaAddress: paythenaContract.address,
        userAddress: address,
        companyDetails: Object.values(companyDetails).map(x => x.toString()),
      });

      // First approve
      await approveUSDe({
        functionName: "approve",
        args: [paythenaContract.address, parsedAmount] as const,
      });
      notification.info("Approval confirmed");

      // Then deposit
      await depositFunds({
        functionName: "deposit",
        args: [parsedAmount] as const,
      });
      notification.success("Funds deposited successfully!");
      setAmount("");
    } catch (error: any) {
      console.error("Full error:", error);
      if (error.message.includes("CompanyNotActive")) {
        notification.error("Company is not active");
      } else if (error.message.includes("InvalidAmount")) {
        notification.error("Invalid amount");
      } else if (error.message.includes("TransferFailed")) {
        notification.error("Transfer failed. Please check your balance");
      } else {
        notification.error("Failed to deposit funds");
      }
    } finally {
      setIsDepositing(false);
    }
  };

  const handleRemoveContributor = async (contributorAddress: string) => {
    try {
      await removeContributor({
        functionName: "removeContributor",
        args: [contributorAddress] as const,
      });
      notification.success("Contributor removed successfully!");
    } catch (error) {
      notification.error("Failed to remove contributor");
    }
  };

  const handleProcessPayroll = async () => {
    try {
      if (!selectedContributor) {
        notification.error("Please select a contributor first");
        return;
      }

      if (!selectedContributorData?.isActive) {
        notification.error("Contributor is not active");
        return;
      }

      const paymentStatus = getPaymentStatus(selectedContributorData);
      if (paymentStatus.status === "Paid") {
        notification.error("Payment already processed for this period");
        return;
      }

      // Process the payroll and get the transaction response
      const result = await processPayroll({
        functionName: "processSalary",
        args: [selectedContributor] as const,
      });

      // Wait for transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh data
      await refreshData(setRefreshKey);
      
      // Show success notification with transaction hash
      if (result && typeof result === 'string') {
        notification.success(
          <div className="flex flex-col gap-1">
            <p>Payroll processed successfully!</p>
            <a 
              href={`https://sepolia.etherscan.io/tx/${result}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:opacity-80 truncate"
            >
              View transaction: {result.slice(0, 6)}...{result.slice(-4)}
            </a>
          </div>
        );
      } else {
        notification.success("Payroll processed successfully!");
      }

    } catch (error: any) {
      console.error("Process payroll error:", error);
      if (error.message.includes("Payment already processed")) {
        notification.error("Payment already processed for this period");
      } else if (error.message.includes("Payment not due")) {
        notification.error("Payment is not due yet");
      } else if (error.message.includes("Insufficient balance")) {
        notification.error("Insufficient company balance");
      } else {
        notification.error("Failed to process payroll");
      }
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshData(setRefreshKey);
      notification.success("Data refreshed successfully!");
    } catch (error) {
      console.error("Refresh error:", error);
      notification.error("Failed to refresh data");
    }
  };

  return (
    <div className="flex flex-col gap-8 p-4 max-w-7xl mx-auto">
      {/* Page Header - Using primary color for highlight */}
      <div className="bg-base-200 rounded-box p-4 shadow-sm border border-base-300">
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold text-primary">Company Dashboard</h1>
          <div className="text-sm breadcrumbs">
            <ul>
              <li><Link href="/" className="text-primary hover:opacity-80">Home</Link></li>
              <li className="text-base-content/70">Dashboard</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Company Info Card */}
          <div className="card bg-base-100 shadow-lg border border-base-200 hover:border-primary/20 transition-colors">
            <div className="card-body">
              <h2 className="card-title flex gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Company Details
              </h2>
              {companyDetails && (
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div className="stat bg-base-200 rounded-box">
                    <div className="stat-title">Name</div>
                    <div className="stat-value text-lg truncate">{companyDetails[0]}</div>
                  </div>
                  <div className="stat bg-base-200 rounded-box">
                    <div className="stat-title">Balance</div>
                    <div className="stat-value text-lg">{formatEther(companyDetails[1])} USDe</div>
                    <div className="stat-actions mt-2">
                      <button
                        className="btn btn-sm btn-outline gap-2"
                        onClick={async () => {
                          try {
                            await mintUsde({
                              functionName: "mint",
                              args: [address, parseEther("10000")] as const,
                            });
                            notification.success("Minted 10,000 USDe");
                            await refreshData(setRefreshKey);
                          } catch (error) {
                            console.error("Mint error:", error);
                            notification.error("Failed to mint USDe");
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Get Test USDe
                      </button>
                    </div>
                  </div>
                  <div className="stat bg-base-200 rounded-box">
                    <div className="stat-title">Status</div>
                    <div className="stat-value text-lg">
                      <span className={`badge ${companyDetails[3] ? "badge-success" : "badge-error"}`}>
                        {companyDetails[3] ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="stat bg-base-200 rounded-box">
                    <div className="stat-title">Automation</div>
                    <div className="flex justify-between items-center">
                      <span className={`badge badge-lg ${isAutomated ? "badge-success" : "badge-warning"}`}>
                        {isAutomated ? "Enabled" : "Disabled"}
                      </span>
                      <button
                        className={`btn btn-sm ${isAutomated ? "btn-error" : "btn-success"}`}
                        onClick={async () => {
                          try {
                            if (isAutomated) {
                              await disableAutomation({
                                functionName: "disableAutomation",
                              });
                            } else {
                              await enableAutomation({
                                functionName: "enableAutomation",
                              });
                            }
                            await refreshData(setRefreshKey);
                            notification.success(`Automation ${isAutomated ? "disabled" : "enabled"}!`);
                          } catch (error) {
                            notification.error("Failed to update automation status");
                          }
                        }}
                      >
                        {isAutomated ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deposit Form Card */}
          <div className="card bg-base-100 shadow-lg border border-base-200 hover:border-primary/20 transition-colors">
            <div className="card-body">
              <h2 className="card-title flex gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Deposit Funds
              </h2>
              <form onSubmit={handleDeposit} className="mt-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Amount (USDe)</span>
                  </label>
                  <div className="join w-full">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      className="input input-bordered join-item flex-1"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      disabled={isDepositing}
                    />
                    <button
                      type="submit"
                      className={`btn btn-primary join-item ${isDepositing ? "loading" : ""}`}
                      disabled={isDepositing || !amount || parseFloat(amount) <= 0}
                    >
                      {isDepositing ? "Depositing..." : "Deposit"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card bg-base-100 shadow-lg border border-base-200 hover:border-primary/20 transition-colors">
            <div className="card-body">
              <h2 className="card-title flex gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
              </h2>
              <div className="divider my-2"></div>
              <div className="flex flex-col gap-3">
                <div className="bg-base-200 rounded-box p-3">
                  <div className="text-sm opacity-70 mb-2">Selected Contributor</div>
                  <div className="badge badge-lg badge-outline">
                    {selectedContributor ? (selectedContributorData?.name || "Loading...") : "None selected"}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    className={`btn btn-primary ${!selectedContributor || !selectedContributorData?.isActive ? 'btn-disabled' : ''}`}
                    onClick={handleProcessPayroll}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                    Process Payroll
                  </button>
                  <button
                    className={`btn btn-secondary ${!selectedContributor ? 'btn-disabled' : ''}`}
                    onClick={async () => {
                      try {
                        if (!selectedContributor) {
                          notification.error("Please select a contributor first");
                          return;
                        }
                        const now = Math.floor(Date.now() / 1000);
                        await updateNextPayment({
                          functionName: "updateNextPayment",
                          args: [selectedContributor, BigInt(now)] as const,
                        });
                        notification.success("Payment date updated!");
                      } catch (error) {
                        console.error("Update payment date error:", error);
                        notification.error("Failed to update payment date");
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Set Payment Due
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Contributors List */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-lg border border-base-200 hover:border-primary/20 transition-colors h-full">
            <div className="card-body p-0">
              {/* Header */}
              <div className="p-4 flex justify-between items-center border-b border-base-200 sticky top-0 bg-base-100 z-10">
                <div className="flex items-center gap-3">
                  <h2 className="card-title">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Contributors
                  </h2>
                  <div className="badge badge-neutral">{contributorAddresses?.length || 0}</div>
                  <button 
                    className="btn btn-ghost btn-sm btn-circle tooltip tooltip-bottom"
                    data-tip="Refresh data"
                    onClick={handleRefresh}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <button 
                  className="btn btn-primary btn-sm gap-2"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Contributor
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="table table-zebra table-pin-rows w-full">
                  <thead>
                    <tr className="bg-base-200">
                      <th className="w-16 bg-base-200">Select</th>
                      <th className="bg-base-200">Name</th>
                      <th className="bg-base-200">Address</th>
                      <th className="bg-base-200">Salary</th>
                      <th className="bg-base-200">Payment Info</th>
                      <th className="bg-base-200">Status</th>
                      <th className="w-32 bg-base-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributorAddresses?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-base-content/60">No contributors found</p>
                            <button 
                              className="btn btn-primary btn-sm mt-2"
                              onClick={() => setIsAddModalOpen(true)}
                            >
                              Add your first contributor
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      contributorAddresses?.map(contributorAddress => (
                        <ContributorDetails
                          key={`${contributorAddress}-${refreshKey}`}
                          address={address}
                          contributorAddress={contributorAddress}
                          onRemove={handleRemoveContributor}
                          onConfigureSalary={addr => {
                            setSelectedContributor(addr);
                            setIsConfigureModalOpen(true);
                          }}
                          selectedContributor={selectedContributor}
                          onSelectContributor={setSelectedContributor}
                          refreshData={() => refreshData(setRefreshKey)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddContributorModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async () => {
          await refreshData(setRefreshKey);
          setIsAddModalOpen(false);
        }}
      />
      <ConfigureSalaryModal
        isOpen={isConfigureModalOpen}
        onClose={() => setIsConfigureModalOpen(false)}
        contributorAddress={selectedContributor}
        companyAddress={address}
        onSuccess={async () => {
          await refreshData(setRefreshKey);
          setIsConfigureModalOpen(false);
        }}
      />
    </div>
  );
};

export default CompanyDashboard;
