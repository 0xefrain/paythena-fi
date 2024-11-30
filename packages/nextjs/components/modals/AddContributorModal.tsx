import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseEther, getAddress } from "viem";
import { isAddress } from "viem";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface AddContributorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export const AddContributorModal = ({ isOpen, onClose, onSuccess }: AddContributorModalProps) => {
  const { address: companyAddress } = useAccount();
  const [isCompanyRegistered, setIsCompanyRegistered] = useState(false);
  const [contributorAddress, setContributorAddress] = useState("");
  const [contributorName, setContributorName] = useState("");
  const [salary, setSalary] = useState("");
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'days'>('minutes');
  const [paymentFrequency, setPaymentFrequency] = useState("86400"); // 1 day in seconds
  const [isProcessing, setIsProcessing] = useState(false);

  const { writeContractAsync: addContributor } = useScaffoldWriteContract("PaythenaCore");

  // Get company role
  const { data: companyRole } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "COMPANY_ROLE",
  });

  // Check if address has company role
  const { data: hasCompanyRole } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "hasRole",
    args: [companyRole, companyAddress],
    enabled: !!companyRole && !!companyAddress,
  });

  // Get company details
  const { data: companyDetails } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getCompanyDetails",
    args: [companyAddress],
    enabled: !!companyAddress,
  });

  useEffect(() => {
    if (hasCompanyRole && companyDetails?.[3]) { // isActive check
      setIsCompanyRegistered(true);
    } else {
      setIsCompanyRegistered(false);
    }
  }, [hasCompanyRole, companyDetails]);

  // Debug logs for company status
  useEffect(() => {
    console.log("Company Status:", {
      companyAddress,
      companyRole,
      hasCompanyRole,
      companyDetails,
      isCompanyRegistered
    });
  }, [companyAddress, companyRole, hasCompanyRole, companyDetails, isCompanyRegistered]);

  const validateAddress = (address: string): boolean => {
    try {
      return isAddress(address);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Log all parameters before submission
      console.log("Submission Parameters:", {
        companyAddress,
        contributorAddress,
        contributorName,
        salary,
        paymentFrequency,
        isCompanyRegistered,
        hasCompanyRole
      });

      // Check if company is registered
      if (!isCompanyRegistered) {
        notification.error("Company is not registered or not active");
        return;
      }

      // Validate inputs
      if (!companyAddress) {
        throw new Error("Company address not found");
      }

      if (!contributorAddress || !validateAddress(contributorAddress)) {
        throw new Error("Invalid contributor address");
      }

      if (!contributorName.trim()) {
        throw new Error("Contributor name is required");
      }

      if (!salary || Number(salary) <= 0) {
        throw new Error("Invalid salary amount");
      }

      if (!paymentFrequency || Number(paymentFrequency) <= 0) {
        throw new Error("Invalid payment frequency");
      }

      setIsProcessing(true);

      // Format parameters
      const formattedAddress = getAddress(contributorAddress);
      const formattedName = contributorName.trim();
      const formattedSalary = parseEther(salary);
      const formattedFrequency = BigInt(paymentFrequency);

      // Log formatted parameters
      console.log("Formatted Parameters:", {
        formattedAddress,
        formattedName,
        formattedSalary: formattedSalary.toString(),
        formattedFrequency: formattedFrequency.toString()
      });

      // Call contract with explicit types
      const tx = await addContributor({
        functionName: "addContributor",
        args: [
          formattedAddress as `0x${string}`,
          formattedName,
          formattedSalary,
          formattedFrequency,
        ] as const,
      });

      console.log("Transaction:", tx);

      // Wait for transaction confirmation
      await new Promise(resolve => setTimeout(resolve, 3000)); // Increased wait time
      
      // Refresh data
      await onSuccess();
      
      // Reset form and close modal
      setContributorAddress("");
      setContributorName("");
      setSalary("");
      setPaymentFrequency("86400");
      onClose();
      
      notification.success("Contributor added successfully!");
    } catch (error: any) {
      console.error("Detailed error:", {
        error,
        message: error.message,
        data: error.data,
        code: error.code,
        stack: error.stack
      });

      // More specific error handling
      const errorMessage = error.message?.toLowerCase() || "";
      if (errorMessage.includes("unauthorized")) {
        notification.error("Company is not registered or not active");
      } else if (errorMessage.includes("missing parameters") || errorMessage.includes("without any data")) {
        notification.error("Contract data formatting error");
        console.error("Contract call failed with parameters:", {
          address: contributorAddress,
          name: contributorName,
          salary,
          frequency: paymentFrequency,
          formattedParams: {
            address: formattedAddress,
            name: formattedName,
            salary: formattedSalary?.toString(),
            frequency: formattedFrequency?.toString()
          }
        });
      } else {
        notification.error(`Failed to add contributor: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Add address validation on input change
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContributorAddress(value);
    
    // Real-time validation feedback
    if (value && !value.startsWith("0x")) {
      e.target.setCustomValidity("Address must start with 0x");
    } else if (value && !validateAddress(value)) {
      e.target.setCustomValidity("Invalid Ethereum address");
    } else {
      e.target.setCustomValidity("");
    }
  };

  if (!isOpen) return null;

  // Early return if company is not registered
  if (!isCompanyRegistered) {
    return (
      <div className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error">Company Not Registered</h3>
          <p className="py-4">
            Please register your company first to add contributors.
          </p>
          <div className="modal-action">
            <button className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Add New Contributor</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control gap-4">
            <div>
              <label className="label">
                <span className="label-text">Contributor Address</span>
              </label>
              <input
                type="text"
                placeholder="0x..."
                className="input input-bordered w-full"
                value={contributorAddress}
                onChange={handleAddressChange}
                pattern="^0x[a-fA-F0-9]{40}$"
                title="Please enter a valid Ethereum address"
                disabled={isProcessing}
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Contributor Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter name"
                className="input input-bordered w-full"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                disabled={isProcessing}
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
                placeholder="Enter amount"
                className="input input-bordered w-full"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                disabled={isProcessing}
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Payment Frequency (days)</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="1"
                  className="input input-bordered w-full"
                  value={Number(paymentFrequency) / 86400} // Convert seconds to days
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setPaymentFrequency((value * 86400).toString()); // Convert days to seconds
                  }}
                  min="1"
                  max="30"
                  disabled={isProcessing}
                  required
                />
                <div className="tooltip" data-tip="Payment cycle in days (1-30)">
                  <span className="badge badge-sm">days</span>
                </div>
              </div>
              <label className="label">
                <span className="label-text-alt">How often the salary will be paid</span>
              </label>
            </div>
          </div>

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${isProcessing ? "loading" : ""}`}
              disabled={isProcessing}
            >
              {isProcessing ? "Adding..." : "Add Contributor"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}>
        <button className="cursor-default">Cancel</button>
      </div>
    </div>
  );
}; 