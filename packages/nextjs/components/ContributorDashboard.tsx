"use client";

import { LoanDashboard } from "./LoanDashboard";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const ContributorDashboard = () => {
  const { address } = useAccount();

  // Get company address
  const { data: companyAddress } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "contributorToCompany",
    args: [address],
  }) as { data: string | undefined };

  // Get contributor details
  const { data: details } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getContributorDetails",
    args: [companyAddress, address],
  }) as { data: [string, bigint, bigint, bigint, boolean] | undefined };

  if (!details || !companyAddress || !address) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const [name, salary, nextPayment, paymentFrequency, isActive] = details;

  return (
    <div className="flex flex-col gap-6 p-6 bg-base-200 min-h-screen">
      {/* Contributor Header */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="card-title text-2xl">{name || "Contributor Dashboard"}</h2>
              <p className="text-sm opacity-70">Company: {companyAddress}</p>
            </div>
            <div className={`badge ${isActive ? "badge-success" : "badge-error"}`}>
              {isActive ? "Active" : "Inactive"}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Salary Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Salary</h3>
            <p className="text-2xl font-bold font-mono">{formatEther(salary)} USDe</p>
            <p className="text-sm opacity-70">Every {Number(paymentFrequency) / 86400} days</p>
          </div>
        </div>

        {/* Next Payment Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Next Payment</h3>
            <p className="text-2xl font-bold">{new Date(Number(nextPayment) * 1000).toLocaleDateString()}</p>
            <p className="text-sm opacity-70">{getTimeUntilNextPayment(nextPayment)}</p>
          </div>
        </div>

        {/* Payment History Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Payment History</h3>
            <PaymentHistory companyAddress={companyAddress} contributorAddress={address} />
          </div>
        </div>
      </div>

      {/* Loan Section */}
      <LoanDashboard address={address as string} />
    </div>
  );
};

// Update PaymentHistory types
interface PaymentRecord {
  timestamp: bigint;
  amount: bigint;
}

const PaymentHistory = ({
  companyAddress,
  contributorAddress,
}: {
  companyAddress: string;
  contributorAddress: string;
}) => {
  const { data: payments } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getPaymentHistory",
    args: [companyAddress, contributorAddress],
  }) as { data: PaymentRecord[] | undefined };

  if (!payments || !Array.isArray(payments) || payments.length === 0) {
    return <p className="text-sm opacity-70">No payment history</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-xs">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {payments.slice(0, 5).map((payment: any, index) => (
            <tr key={index}>
              <td>{new Date(Number(payment.timestamp) * 1000).toLocaleDateString()}</td>
              <td className="font-mono">{formatEther(payment.amount)} USDe</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper function for time until next payment
const getTimeUntilNextPayment = (nextPayment: bigint) => {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const timeLeft = Number(nextPayment - now);

  if (timeLeft <= 0) return "Payment Due";

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
};
