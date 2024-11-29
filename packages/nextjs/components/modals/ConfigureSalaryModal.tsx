import { useState } from "react";
import { parseEther } from "viem";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface ConfigureSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  contributorAddress: string;
  companyAddress: string | undefined;
  onSuccess?: () => Promise<void>;
}

export const ConfigureSalaryModal = ({ isOpen, onClose, contributorAddress, companyAddress, onSuccess }: ConfigureSalaryModalProps) => {
  const [salary, setSalary] = useState("");
  const [frequency, setFrequency] = useState("");

  const { data: contributor } = useScaffoldReadContract<"PaythenaCore", "getContributorDetails">({
    contractName: "PaythenaCore",
    functionName: "getContributorDetails",
    args: [companyAddress as string, contributorAddress],
  });

  const { writeContractAsync: configureSalary } = useScaffoldWriteContract("PaythenaCore");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await configureSalary({
        functionName: "updateContributor",
        args: [
          contributorAddress,
          parseEther(salary),
          BigInt(Number(frequency) * 86400) // Convert days to seconds
        ] as const,
      });
      notification.success("Salary configured successfully!");
      if (onSuccess) await onSuccess();
      else onClose();
    } catch (error) {
      console.error("Configure salary error:", error);
      notification.error("Failed to configure salary");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Configure Salary</h3>
        <p className="text-sm mb-4">Contributor: {contributorAddress}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-control gap-4">
            <div>
              <label className="label">
                <span className="label-text">New Salary (USDe)</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered w-full"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="1000"
                required
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">New Payment Frequency (days)</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                min="1"
                max="30"
                required
              />
            </div>
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Update Salary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 