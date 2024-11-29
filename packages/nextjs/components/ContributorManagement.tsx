import { useState } from "react";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { parseEther } from "viem";
import { useAccount } from "wagmi";

export const ContributorManagement = () => {
  const { address } = useAccount();
  const [contributorAddress, setContributorAddress] = useState("");
  const [contributorName, setContributorName] = useState("");
  const [salary, setSalary] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState("604800"); // 7 days in seconds

  const { writeContractAsync: addContributor } = useScaffoldWriteContract("PaythenaCore");
  const { data: contributors } = useScaffoldReadContract<"PaythenaCore", string>({
    contractName: "PaythenaCore",
    functionName: "getContributorList",
    args: [address],
  }) as { data: string[] | undefined };

  const { writeContractAsync: removeContributor } = useScaffoldWriteContract("PaythenaCore");

  const handleAddContributor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addContributor({
        functionName: "addContributor",
        args: [
          contributorAddress,
          contributorName,
          parseEther(salary),
          BigInt(paymentFrequency)
        ] as const,
      });
      notification.success("Contributor added successfully!");
      setContributorAddress("");
    } catch (error) {
      console.error("Add contributor error:", error);
      notification.error("Failed to add contributor");
    }
  };

  const handleConfigureSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addContributor({
        functionName: "addContributor",
        args: [
          contributorAddress,
          contributorName,
          parseEther(salary),
          BigInt(paymentFrequency)
        ] as const,
      });
      notification.success("Salary updated successfully!");
      setSalary("");
    } catch (error) {
      console.error("Salary update error:", error);
      notification.error("Failed to update salary");
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
      console.error("Remove contributor error:", error);
      notification.error("Failed to remove contributor");
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Contributor Management</h2>
        
        {/* Add Contributor Form */}
        <form onSubmit={handleAddContributor} className="mb-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Contributor Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter name"
              className="input input-bordered"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Contributor Address</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered"
              value={contributorAddress}
              onChange={(e) => setContributorAddress(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary mt-4">
            Add Contributor
          </button>
        </form>

        {/* Configure Salary Form */}
        <form onSubmit={handleConfigureSalary}>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Contributor Address</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered"
              value={contributorAddress}
              onChange={(e) => setContributorAddress(e.target.value)}
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Salary Amount (USDe)</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Enter amount"
              className="input input-bordered"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Payment Frequency (days)</span>
            </label>
            <input
              type="number"
              placeholder="7"
              className="input input-bordered"
              value={Number(paymentFrequency) / 86400} // Convert seconds to days
              onChange={(e) => setPaymentFrequency((Number(e.target.value) * 86400).toString())} // Convert days to seconds
              required
            />
          </div>
          <button type="submit" className="btn btn-primary mt-4">
            Configure Salary
          </button>
        </form>

        {/* Contributors List */}
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4">Current Contributors</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contributors?.map((contributor, index) => (
                  <tr key={index}>
                    <td>{contributor}</td>
                    <td>
                      <button 
                        className="btn btn-xs btn-error"
                        onClick={() => handleRemoveContributor(contributor)}
                      >
                        Remove
                      </button>
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