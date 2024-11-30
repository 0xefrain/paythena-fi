import { useCallback, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface LoanInfo {
  loanBalance: bigint;
  creditScore: number;
  status: number;
}

export const LoanDashboard = ({ address }: { address: string }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");

  // Get loan info
  const { data: loanInfo } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getLoanInfo",
    args: [address],
  }) as { data: LoanInfo };

  // Contract write functions
  const { writeContractAsync: requestLoan } = useScaffoldWriteContract("PaythenaLoan");
  useScaffoldWriteContract("PaythenaLoan");

  const handleRequestLoan = useCallback(async () => {
    if (!loanAmount) return;

    setIsProcessing(true);
    try {
      await requestLoan({
        functionName: "requestLoan",
        args: [parseEther(loanAmount)] as const,
      });
      notification.success("Loan requested successfully");
      setLoanAmount("");
    } catch (error: any) {
      console.error("Loan request error:", error);
      notification.error("Failed to request loan");
    } finally {
      setIsProcessing(false);
    }
  }, [loanAmount, requestLoan]);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Loan Dashboard</h2>

        {/* Loan Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <div className="stat bg-base-200 rounded-box">
            <div className="stat-title">Current Loan</div>
            <div className="stat-value text-primary">
              {loanInfo?.loanBalance ? formatEther(loanInfo.loanBalance) : "0"} USDe
            </div>
          </div>

          <div className="stat bg-base-200 rounded-box">
            <div className="stat-title">Credit Score</div>
            <div className="stat-value">{loanInfo?.creditScore?.toString() || "N/A"}</div>
          </div>

          <div className="stat bg-base-200 rounded-box">
            <div className="stat-title">Status</div>
            <div className="stat-value">
              <span className={`badge ${getLoanStatusBadgeClass(loanInfo?.status)}`}>
                {formatLoanStatus(loanInfo?.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Loan Actions */}
        <div className="flex gap-4 mt-4">
          <div className="form-control flex-1">
            <label className="label">
              <span className="label-text">Request Loan Amount</span>
            </label>
            <div className="input-group">
              <input
                type="number"
                placeholder="Enter amount"
                className="input input-bordered w-full"
                value={loanAmount}
                onChange={e => setLoanAmount(e.target.value)}
                disabled={isProcessing}
              />
              <button
                className={`btn btn-primary ${isProcessing ? "loading" : ""}`}
                onClick={handleRequestLoan}
                disabled={isProcessing || !loanAmount}
              >
                Request Loan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getLoanStatusBadgeClass = (status: number | undefined) => {
  switch (status) {
    case 0:
      return "badge-neutral"; // None
    case 1:
      return "badge-warning"; // Pending
    case 2:
      return "badge-success"; // Active
    case 3:
      return "badge-error"; // Defaulted
    case 4:
      return "badge-info"; // Repaid
    default:
      return "badge-neutral";
  }
};

const formatLoanStatus = (status: number | undefined) => {
  switch (status) {
    case 0:
      return "No Loan";
    case 1:
      return "Pending";
    case 2:
      return "Active";
    case 3:
      return "Defaulted";
    case 4:
      return "Repaid";
    default:
      return "Unknown";
  }
};
