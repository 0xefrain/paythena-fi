import { useState } from "react";
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface AddContributorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddContributorModal = ({ isOpen, onClose }: AddContributorModalProps) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [salary, setSalary] = useState("");
  const [frequency, setFrequency] = useState("7"); // Default 7 days

  const { writeContractAsync: addContributor } = useScaffoldWriteContract("PaythenaCore");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addContributor({
        functionName: "addContributor",
        args: [
          address,
          name,
          parseEther(salary),
          BigInt(Number(frequency) * 86400) // Convert days to seconds
        ] as const,
      });
      notification.success("Contributor added successfully!");
      onClose();
    } catch (error) {
      console.error("Add contributor error:", error);
      notification.error("Failed to add contributor");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Add New Contributor</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control gap-4">
            <div>
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contributor name"
                required
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Address</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Salary (USDe)</span>
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
                <span className="label-text">Payment Frequency (days)</span>
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
              Add Contributor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 