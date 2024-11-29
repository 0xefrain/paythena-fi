import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface CompanyDetails {
  0: string; // name
  1: bigint; // balance
  2: bigint; // contributors count
  3: boolean; // isActive
}

interface PaymentRecord {
  timestamp: bigint;
  amount: bigint;
  processed: boolean;
  txHash: string;
}

// Add this function
const getTimeUntilPayment = (nextPayment: bigint) => {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const timeLeft = Number(nextPayment - now);

  if (timeLeft <= 0) return "Payment is due";

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
};

interface ContributorDashboardProps {
  contributorDetails: {
    name: string;
    salary: bigint;
    isActive: boolean;
    exists: boolean;
    companyAddress: string;
  };
}

export const ContributorDashboard = ({ contributorDetails }: ContributorDashboardProps) => {
  const { address } = useAccount();

  // Get payment history
  const { data: paymentHistory } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getPaymentHistory",
    args: [contributorDetails.companyAddress, address],
  }) as { data: PaymentRecord[] | undefined };

  return (
    <div className="flex flex-col gap-8 p-4">
      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Status</div>
          <div className={`stat-value ${contributorDetails.isActive ? "text-success" : "text-error"}`}>
            {contributorDetails.isActive ? "Active" : "Inactive"}
          </div>
          <div className="stat-desc">Contributor Name: {contributorDetails.name}</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Current Salary</div>
          <div className="stat-value">{formatEther(contributorDetails.salary)} USDe</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Company</div>
          <div className="stat-value text-sm">{contributorDetails.companyAddress}</div>
        </div>
      </div>

      {/* Payment History */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory?.map((payment, index) => (
                  <tr key={index}>
                    <td>{new Date(Number(payment.timestamp) * 1000).toLocaleDateString()}</td>
                    <td>{formatEther(payment.amount)} USDe</td>
                    <td>
                      <span className={`badge ${payment.processed ? "badge-success" : "badge-warning"}`}>
                        {payment.processed ? "Processed" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${payment.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary"
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
      </div>
    </div>
  );
};
