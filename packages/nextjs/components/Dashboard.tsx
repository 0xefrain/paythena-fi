"use client";

import { useCallback, useState } from "react";
import { DepositButton } from "./DepositButton";
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Contract write functions
  useScaffoldWriteContract("PaythenaCore");
  useScaffoldWriteContract("PaythenaCore");
  const { writeContractAsync: removeContributor } = useScaffoldWriteContract("PaythenaCore");
  useScaffoldWriteContract("USDe");
  useScaffoldWriteContract("USDe");

  useDeployedContractInfo("PaythenaCore");

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      notification.success("Dashboard refreshed!");
    } catch (error) {
      notification.error("Failed to refresh");
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

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
    <div className="flex flex-col gap-6 p-6 bg-gradient-to-br from-base-100 to-base-300 min-h-screen">
      {/* Header Section */}
      <header className="bg-base-100 rounded-xl p-6 shadow-lg border-2 border-primary/20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">{companyDetails?.name || "Company Dashboard"}</h1>
            <div className="text-sm breadcrumbs text-base-content/70">
              <ul>
                <li>Home</li>
                <li>Dashboard</li>
              </ul>
            </div>
          </div>

          {/* Enhanced Payment Status Card */}
          <div className="flex items-center gap-4">
            <div className="stats bg-base-200 shadow-md border border-primary/10">
              <div className="stat px-6">
                <div className="stat-title font-medium flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Payment Status
                </div>
                <div className="stat-value text-sm mt-1">
                  <span className={`badge ${getPaymentOverview().class} badge-sm`}>{getPaymentOverview().status}</span>
                </div>
                <div className="stat-desc font-medium mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {getPaymentOverview().nextDue}
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              className="btn btn-circle btn-ghost btn-sm hover:bg-base-200 transition-colors"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh Dashboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 ${isRefreshing ? "animate-spin-slow" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Active Features */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-6">
          {/* Company Details Card - Full Width */}
          <div className="card bg-base-100 shadow-lg border-2 border-primary/20 hover:shadow-xl transition-all duration-200">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                    clipRule="evenodd"
                  />
                </svg>
                Company Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                {/* Balance */}
                <div className="stat bg-base-200 rounded-xl shadow-sm border border-primary/10 hover:shadow-md transition-all">
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
                  <div className="stat-value text-lg font-mono">
                    {formatEther(companyDetails?.balance || BigInt(0))} USDe
                  </div>
                  <div className="stat-actions mt-2">
                    <DepositButton />
                  </div>
                </div>

                {/* Status */}
                <div className="stat bg-base-200 rounded-xl shadow-sm border border-primary/10 hover:shadow-md transition-all">
                  <div className="stat-title flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-success"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Status
                  </div>
                  <div className="stat-value text-lg">
                    <span className={`badge ${companyDetails?.isActive ? "badge-success" : "badge-error"} badge-sm`}>
                      {companyDetails?.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Total Paid */}
                <div className="stat bg-base-200 rounded-xl shadow-sm border border-primary/10 hover:shadow-md transition-all">
                  <div className="stat-title flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-success"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Total Paid
                  </div>
                  <div className="stat-value text-lg font-mono">25,000 USDe</div>
                  <div className="stat-desc">All time payments</div>
                </div>

                {/* Automation */}
                <div className="stat bg-base-200 rounded-xl shadow-sm border border-primary/10 hover:shadow-md transition-all">
                  <div className="stat-title flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-warning"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Automation
                  </div>
                  <div className="stat-value text-lg">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-warning badge-sm">Disabled</span>
                      <button
                        className="btn btn-xs btn-success"
                        onClick={() => notification.info("Automation coming soon!")}
                      >
                        Enable
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contributors Overview - Spans 2 columns */}
                <div className="md:col-span-2 stat bg-base-200 rounded-xl shadow-sm border border-primary/10 hover:shadow-md transition-all">
                  <div className="stat-title flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-info"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    Contributors Overview
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="stat-value text-lg">{contributors?.length || 0}</div>
                      <div className="stat-desc">Total Contributors</div>
                    </div>
                    <div className="text-sm text-base-content/70">
                      Last added: {contributors?.length ? "Recently" : "None"}
                    </div>
                  </div>
                </div>

                {/* Next Payments - Spans 2 columns */}
                <div className="md:col-span-2 stat bg-base-200 rounded-xl shadow-sm border border-primary/10 hover:shadow-md transition-all">
                  <div className="stat-title flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-warning"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Next Payments
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="stat-value text-lg">{getPendingPayments()} Due</div>
                      <div className="stat-desc">Payments to process</div>
                    </div>
                    <div className="text-sm text-base-content/70">Next due: {getPaymentOverview().nextDue}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contributors Card - Full Width */}
          <div className="card bg-base-100 shadow-lg border-2 border-primary/20 hover:shadow-xl transition-all duration-200">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title flex items-center gap-2 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Contributors
                  <span className="badge badge-sm badge-primary bg-opacity-80 backdrop-blur">
                    {contributors?.length || 0}
                  </span>
                </h2>
                <button
                  className="btn btn-primary btn-sm gap-2 hover:scale-105 transition-transform"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 animate-pulse"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add
                </button>
              </div>

              {/* Contributors Table */}
              <div className="overflow-x-auto rounded-xl border border-primary/10">
                <table className="table table-zebra w-full">
                  <thead className="bg-base-200 text-base-content/70">
                    <tr>
                      <th className="w-[40px]">Select</th>
                      <th className="w-[25%]">Name</th>
                      <th className="w-[15%]">Status</th>
                      <th className="w-[30%]">Payment Info</th>
                      <th className="w-[20%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributors?.length === 0 ? (
                      <tr className="hover:bg-base-200/50 transition-colors">
                        <td colSpan={4} className="text-center py-8 text-base-content/70">
                          <div className="flex flex-col items-center gap-4 p-8 text-base-content/70">
                            <div className="rounded-full bg-base-200 p-4">
                              <svg
                                className="h-8 w-8 animate-pulse"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                              </svg>
                            </div>
                            <span className="font-medium">No contributors yet</span>
                            <button
                              className="btn btn-primary btn-sm hover:scale-105 transition-transform"
                              onClick={() => setIsAddModalOpen(true)}
                            >
                              Add your first contributor
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      contributors?.map(contributor => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Analytics Card - Full Width */}
          <div className="card bg-base-100 shadow-lg border-2 border-primary/20 hover:shadow-xl transition-all duration-200">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Analytics
              </h2>

              <div className="grid gap-4 mt-4">
                {/* Transaction History */}
                <div className="bg-base-200 rounded-xl p-4">
                  <h3 className="font-bold mb-4">Recent Transactions</h3>
                  <div className="overflow-x-auto">
                    <table className="table table-xs w-full">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <span className="badge badge-ghost badge-sm">Deposit</span>
                          </td>
                          <td>1,000 USDe</td>
                          <td>2 days ago</td>
                          <td>
                            <span className="badge badge-success badge-sm">Completed</span>
                          </td>
                        </tr>
                        {/* Add more transaction rows as needed */}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="stat bg-base-200 rounded-xl">
                    <div className="stat-title">Total Volume</div>
                    <div className="stat-value text-lg">10,000 USDe</div>
                    <div className="stat-desc">All time</div>
                  </div>
                  <div className="stat bg-base-200 rounded-xl">
                    <div className="stat-title">Total Rewards</div>
                    <div className="stat-value text-lg">500 sUSDe</div>
                    <div className="stat-desc">Earned</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Coming Soon Features */}
        <div className="space-y-6">
          {/* Coming Soon Label */}
          <div className="flex items-center gap-2 px-2">
            <span className="text-sm font-medium text-base-content/70">Coming Soon Features</span>
            <span className="badge badge-primary badge-sm">Beta</span>
          </div>

          {/* Staking Overview Card */}
          <div className="card bg-base-100/50 shadow-md border border-primary/10 hover:shadow-lg transition-all duration-200">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                Staking Overview
              </h2>

              <div className="grid gap-4 mt-4">
                {/* Staking Stats */}
                <div className="stats bg-base-200 shadow-sm">
                  <div className="stat">
                    <div className="stat-title">Total Staked</div>
                    <div className="stat-value text-lg">0.00 USDe</div>
                    <div className="stat-desc">Your total staked amount</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">APR</div>
                    <div className="stat-value text-lg text-success">25%</div>
                    <div className="stat-desc">Current staking rate</div>
                  </div>
                </div>

                {/* Staking Actions */}
                <div className="flex gap-4">
                  <div className="form-control flex-1">
                    <label className="label">
                      <span className="label-text">Stake Amount</span>
                    </label>
                    <div className="input-group">
                      <input type="number" placeholder="0.00" className="input input-bordered w-full" disabled />
                      <button className="btn btn-primary" disabled>
                        Stake
                      </button>
                    </div>
                    <label className="label">
                      <span className="label-text-alt text-base-content/70">Coming soon!</span>
                    </label>
                  </div>
                </div>

                {/* Rewards Section */}
                <div className="bg-base-200 rounded-xl p-4">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-warning"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Rewards
                  </h3>
                  <div className="stats bg-base-100 shadow-sm w-full">
                    <div className="stat">
                      <div className="stat-title">Pending Rewards</div>
                      <div className="stat-value text-lg">0.00 sUSDe</div>
                      <div className="stat-actions">
                        <button className="btn btn-xs btn-success" disabled>
                          Claim Rewards
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staking Info */}
                <div className="bg-base-200 rounded-xl p-4">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-info"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Staking Info
                  </h3>
                  <ul className="text-sm space-y-2">
                    <li className="flex justify-between">
                      <span className="text-base-content/70">Lock Period</span>
                      <span className="font-medium">7 days</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-base-content/70">Reward Token</span>
                      <span className="font-medium">sUSDe</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Loan Center Card */}
          <div className="card bg-base-100/50 shadow-md border border-primary/10 hover:shadow-lg transition-all duration-200">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2h-1.528A6 6 0 004 9.528V4z" />
                  <path
                    fillRule="evenodd"
                    d="M8 10a4 4 0 00-3.446 6.032l-1.261 1.26a1 1 0 101.414 1.415l1.261-1.261A4 4 0 108 10zm-2 4a2 2 0 114 0 2 2 0 01-4 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Loan Center
              </h2>

              <div className="grid gap-4 mt-4">
                {/* Loan Stats */}
                <div className="stats bg-base-200 shadow-sm">
                  <div className="stat">
                    <div className="stat-title">Available Credit</div>
                    <div className="stat-value text-lg">5,000 USDe</div>
                    <div className="stat-desc">Based on staked amount</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Active Loans</div>
                    <div className="stat-value text-lg text-warning">1</div>
                    <div className="stat-desc">Total outstanding</div>
                  </div>
                </div>

                {/* Active Loan Overview */}
                <div className="bg-base-200 rounded-xl p-4">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-warning"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Active Loan
                  </h3>
                  <div className="stats bg-base-100 shadow-sm w-full">
                    <div className="stat">
                      <div className="stat-title">Amount</div>
                      <div className="stat-value text-lg">1,000 USDe</div>
                      <div className="stat-desc flex items-center gap-1">
                        <span>Next payment in 5 days</span>
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Interest Rate</div>
                      <div className="stat-value text-lg">3%</div>
                      <div className="stat-desc">Fixed APR</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-4">
                  <div className="form-control flex-1">
                    <label className="label">
                      <span className="label-text">Request New Loan</span>
                    </label>
                    <div className="input-group">
                      <input type="number" placeholder="Amount" className="input input-bordered w-full" disabled />
                      <button className="btn btn-primary" disabled>
                        Request
                      </button>
                    </div>
                    <label className="label">
                      <span className="label-text-alt text-base-content/70">Coming soon!</span>
                    </label>
                  </div>
                </div>

                {/* Loan Terms */}
                <div className="bg-base-200 rounded-xl p-4">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-info"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Loan Terms
                  </h3>
                  <ul className="text-sm space-y-2">
                    <li className="flex justify-between">
                      <span className="text-base-content/70">Maximum Amount</span>
                      <span className="font-medium">5,000 USDe</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-base-content/70">Interest Rate</span>
                      <span className="font-medium">3% APR</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-base-content/70">Term Length</span>
                      <span className="font-medium">30 days</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-base-content/70">Collateral Required</span>
                      <span className="font-medium">None</span>
                    </li>
                  </ul>
                </div>
              </div>
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

// Update ContributorBalanceMonitor to use the countdown component

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isProcessing, setIsProcessing] = useState(false);
  const [] = useState(false);

  // Add contract write hook
  const { writeContractAsync: processPayroll } = useScaffoldWriteContract("PaythenaCore");

  // Use the custom hook
  const details = useContributorDetails(address, contributorAddress);

  // Get payment history
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Add function to get latest payment

  // Get latest payment

  return (
    <tr
      className={`hover:bg-base-200/50 transition-colors ${selectedContributor === contributorAddress ? "bg-primary/5" : ""}`}
    >
      <td>
        <input
          type="radio"
          className="radio radio-sm"
          checked={selectedContributor === contributorAddress}
          onChange={() => onSelectContributor(contributorAddress)}
        />
      </td>
      <td>
        <div className="flex flex-col">
          <span className="font-medium">{details?.name || "Unknown"}</span>
          <span className="text-xs text-base-content/70 truncate w-32" title={contributorAddress}>
            {contributorAddress}
          </span>
        </div>
      </td>
      <td>
        <span className={`badge badge-sm ${status.class}`}>{status.text}</span>
      </td>
      <td>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{formatEther(details?.salary || BigInt(0))} USDe</span>
            {isDue() && <span className="badge badge-warning badge-sm">Due</span>}
          </div>
          <span className="text-xs text-base-content/70">Next: {getTimeUntilNextPayment()}</span>
        </div>
      </td>
      <td>
        <div className="flex gap-2">
          <button
            className={`btn btn-xs ${isDue() ? "btn-warning" : "btn-ghost"}`}
            onClick={handleProcessPayment}
            disabled={!canProcessPayment()}
          >
            Pay
          </button>
          <button className="btn btn-xs btn-error" onClick={handleRemove}>
            Remove
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CompanyDashboard;
