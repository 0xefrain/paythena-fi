"use client";

import { useState } from "react";
import { AddContributorModal } from "./modals/AddContributorModal";
import { ConfigureSalaryModal } from "./modals/ConfigureSalaryModal";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

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

const useRefreshData = (address: string | undefined) => {
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

  return async () => {
    await Promise.all([
      refetchCompany(),
      refetchContributors(),
      refetchAutomation()
    ]);
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
}: {
  address: string | undefined;
  contributorAddress: string;
  onRemove: (address: string) => void;
  onConfigureSalary: (address: string) => void;
  selectedContributor: string;
  onSelectContributor: (address: string) => void;
}) => {
  const { data: contributor } = useScaffoldReadContract<"PaythenaCore", "debugContributor">({
    contractName: "PaythenaCore",
    functionName: "debugContributor",
    args: [address as string, contributorAddress],
  }) as { data: ContributorDebugInfo | undefined };

  const { data: paymentHistory } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getPaymentHistory",
    args: [address, contributorAddress],
  }) as { data: PaymentRecord[] | undefined };

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
    <tr>
      <td>
        <input
          type="radio"
          name="selectedContributor"
          checked={selectedContributor === contributorAddress}
          onChange={() => onSelectContributor(contributorAddress)}
          className="radio radio-primary"
        />
      </td>
      <td>{contributor.name || "N/A"}</td>
      <td>{contributorAddress}</td>
      <td>{contributor.salary ? formatEther(contributor.salary) : "0"} USDe</td>
      <td>
        <div className="text-xs">
          <div>Active: {contributor.isActive ? "Yes" : "No"}</div>
          <div>Exists: {contributor.exists ? "Yes" : "No"}</div>
          <div>Company Active: {contributor.companyActive ? "Yes" : "No"}</div>
          <div>
            Payment Frequency:{" "}
            {contributor.paymentFrequency ? Math.floor(Number(contributor.paymentFrequency) / 86400) : 0} days
          </div>
          <div>
            Last Payment:{" "}
            {contributor.lastPayment ? new Date(Number(contributor.lastPayment) * 1000).toLocaleDateString() : "Never"}
          </div>
          <div>
            Next Payment:{" "}
            {contributor.nextPayment ? new Date(Number(contributor.nextPayment) * 1000).toLocaleDateString() : "N/A"}
          </div>
          <div>Total Contributors: {contributor.contributorCount ? Number(contributor.contributorCount) : 0}</div>
          <div>Is Company Role: {contributor.isCompanyRole ? "Yes" : "No"}</div>
          <div>Is Contributor Role: {contributor.isContributorRole ? "Yes" : "No"}</div>
          <div>
            Time until payment: {contributor.nextPayment ? getTimeUntilPayment(contributor.nextPayment) : "N/A"}
          </div>
          <div className="mt-2">
            <div>Payment History:</div>
            {paymentHistory?.map((payment, index) => (
              <div key={index} className="text-xs">
                ID: {payment.paymentId.toString()} - Amount: {formatEther(payment.amount)} USDe - Date:{" "}
                {new Date(Number(payment.timestamp) * 1000).toLocaleDateString()} -
                <a
                  href={`https://sepolia.etherscan.io/tx/${payment.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  View Transaction
                </a>
              </div>
            ))}
          </div>
        </div>
      </td>
      <td>
        <div className="flex flex-col gap-2">
          <span className={`badge ${contributor.isActive ? "badge-success" : "badge-error"}`}>
            {contributor.isActive ? "Active" : "Inactive"}
          </span>
          <span className={`badge ${getPaymentStatus(contributor).class}`}>{getPaymentStatus(contributor).status}</span>
        </div>
      </td>
      <td className="flex gap-2">
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
  const refreshData = useRefreshData(address);

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

  return (
    <div className="flex flex-col gap-8 p-4">
      {/* Company Info Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <h2 className="card-title">Company Dashboard</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                try {
                  await mintUsde({
                    functionName: "mint",
                    args: [address, parseEther("10000")] as const,
                  });
                  notification.success("Minted 10,000 USDe");
                } catch (error) {
                  console.error("Mint error:", error);
                  notification.error("Failed to mint USDe");
                }
              }}
            >
              Get Test USDe
            </button>
          </div>
          {companyDetails && (
            <>
              <p>Name: {companyDetails[0]}</p>
              <p>Balance: {formatEther(companyDetails[1])} USDe</p>
              <p>Contributors: {companyDetails[2].toString()}</p>
              <p>Status: {companyDetails[3] ? "Active" : "Inactive"}</p>
              <p>
                Automation Status:{" "}
                <span className={`badge ${isAutomated ? "badge-success" : "badge-warning"}`}>
                  {isAutomated ? "Enabled" : "Disabled"}
                </span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Deposit Form Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Deposit Funds</h2>
          <form onSubmit={handleDeposit}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Amount (USDe)</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter amount"
                className="input input-bordered"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={isDepositing}
              />
            </div>
            <div className="card-actions justify-end mt-4">
              <button
                type="submit"
                className={`btn btn-primary ${isDepositing ? "loading" : ""}`}
                disabled={isDepositing || !amount || parseFloat(amount) <= 0}
              >
                {isDepositing ? "Depositing..." : "Deposit"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              className="btn btn-primary flex-1"
              disabled={!selectedContributor || !selectedContributorData?.isActive}
              onClick={async () => {
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

                  await processPayroll({
                    functionName: "processSalary",
                    args: [selectedContributor] as const,
                  });

                  await new Promise(resolve => setTimeout(resolve, 2000));
                  await refreshData();
                  notification.success("Payroll processed successfully!");
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
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              Process Payroll
            </button>

            <button
              className="btn btn-secondary flex-1"
              disabled={!selectedContributor}
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Set Payment Due
            </button>

            <button
              className={`btn flex-1 ${isAutomated ? "btn-error" : "btn-success"}`}
              onClick={async () => {
                try {
                  if (isAutomated) {
                    await disableAutomation({
                      functionName: "disableAutomation",
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await refreshData();
                    notification.success("Automation disabled!");
                  } else {
                    await enableAutomation({
                      functionName: "enableAutomation",
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await refreshData();
                    notification.success("Automation enabled!");
                  }
                } catch (error) {
                  notification.error("Failed to update automation status");
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {isAutomated ? "Disable Automation" : "Enable Automation"}
            </button>
          </div>
        </div>
      </div>

      {/* Contributors List Card */}
      <div className="card bg-base-100 shadow-xl overflow-hidden">
        <div className="card-body p-0">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="card-title">Contributors</h2>
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
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Salary</th>
                  <th>Payment Frequency</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contributorAddresses?.map(contributorAddress => (
                  <ContributorDetails
                    key={contributorAddress}
                    address={address}
                    contributorAddress={contributorAddress}
                    onRemove={handleRemoveContributor}
                    onConfigureSalary={addr => {
                      setSelectedContributor(addr);
                      setIsConfigureModalOpen(true);
                    }}
                    selectedContributor={selectedContributor}
                    onSelectContributor={setSelectedContributor}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddContributorModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async () => {
          await refreshData();
          setIsAddModalOpen(false);
        }}
      />
      <ConfigureSalaryModal
        isOpen={isConfigureModalOpen}
        onClose={() => setIsConfigureModalOpen(false)}
        contributorAddress={selectedContributor}
        companyAddress={address}
        onSuccess={async () => {
          await refreshData();
          setIsConfigureModalOpen(false);
        }}
      />
    </div>
  );
};

export default CompanyDashboard;
