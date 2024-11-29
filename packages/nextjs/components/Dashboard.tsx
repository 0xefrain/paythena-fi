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
            Next Payment:{" "}
            {contributor.nextPayment ? new Date(Number(contributor.nextPayment) * 1000).toLocaleDateString() : "N/A"}
          </div>
          <div>Total Contributors: {contributor.contributorCount ? Number(contributor.contributorCount) : 0}</div>
          <div>Is Company Role: {contributor.isCompanyRole ? "Yes" : "No"}</div>
          <div>Is Contributor Role: {contributor.isContributorRole ? "Yes" : "No"}</div>
        </div>
      </td>
      <td>
        <span className={`badge ${contributor.isActive ? "badge-success" : "badge-error"}`}>
          {contributor.isActive ? "Active" : "Inactive"}
        </span>
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
              <p>Balance: {companyDetails[1].toString()} USDe</p>
              <p>Contributors: {companyDetails[2].toString()}</p>
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

      {/* Add Quick Actions */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Quick Actions</h2>
          <div className="flex gap-4">
            <button
              className="btn btn-secondary"
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

                  await processPayroll({
                    functionName: "processSalary",
                    args: [selectedContributor] as const,
                  });
                  notification.success("Payroll processed successfully!");
                } catch (error: any) {
                  console.error("Process payroll error:", error);
                  if (error.message.includes("Contributor not active")) {
                    notification.error("Contributor is not active");
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
              Process Payroll
            </button>

            <button
              className="btn btn-secondary"
              onClick={async () => {
                try {
                  await pauseCompany({
                    functionName: "pause",
                  });
                  notification.success("Company operations paused!");
                } catch (error) {
                  notification.error("Failed to pause company");
                }
              }}
            >
              Pause Operations
            </button>
          </div>
        </div>
      </div>

      {/* Contributors List Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Contributors</h2>
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
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
      <AddContributorModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <ConfigureSalaryModal
        isOpen={isConfigureModalOpen}
        onClose={() => setIsConfigureModalOpen(false)}
        contributorAddress={selectedContributor}
        companyAddress={address}
      />
    </div>
  );
};

export default CompanyDashboard;
