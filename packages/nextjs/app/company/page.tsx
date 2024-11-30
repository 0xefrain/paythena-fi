"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import CompanyDashboard from "~~/components/Dashboard";
import { RoleGuard } from "~~/components/guards/RoleGuard";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export default function CompanyPage() {
  const { address, isConnected } = useAccount();

  // Get company role and check if wallet has it
  const { data: companyRole, isLoading: isRoleLoading } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "COMPANY_ROLE",
  });

  const { data: hasRole, isLoading: isHasRoleLoading } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "hasRole",
    args: [companyRole, address],
  });

  // Debug logs
  console.log("Company Page State:", {
    isConnected,
    address,
    companyRole,
    hasRole,
    isRoleLoading,
    isHasRoleLoading,
  });

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-base-300 to-base-200">
        <div className="card bg-base-100 shadow-2xl p-8 max-w-lg w-full mx-4 border border-base-300">
          <div className="flex flex-col items-center text-center">
            {/* Company Icon */}
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Company Dashboard Access
            </h2>

            <p className="text-base-content/80 mb-6">Please connect your wallet to access the company dashboard.</p>

            <button className="btn btn-primary btn-wide" onClick={() => document.getElementById("wallet-btn")?.click()}>
              Connect Wallet
            </button>

            <Link href="/" className="btn btn-ghost btn-sm mt-4">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state - only show briefly
  if (isRoleLoading || (isHasRoleLoading && companyRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Not registered state - show if we have completed role checks and user is not a company
  if (!hasRole || hasRole === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-base-300 to-base-200">
        <div className="card bg-base-100 shadow-2xl p-8 max-w-lg w-full mx-4 border border-base-300">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold mb-4">Not Registered</h2>
            <p className="text-base-content/80 mb-6">
              This wallet is not registered as a company. Please register your company first to access the dashboard.
            </p>

            <div className="flex gap-4">
              <Link href="/register" className="btn btn-primary">
                Register Company
              </Link>
              <Link href="/" className="btn btn-ghost">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show dashboard if authorized
  return (
    <RoleGuard requiredRole="COMPANY_ROLE">
      <CompanyDashboard />
    </RoleGuard>
  );
}
