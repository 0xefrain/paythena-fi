"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useScaffoldWriteContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useCompanyStatus } from "~~/hooks/scaffold-eth/useCompanyStatus";
import { notification } from "~~/utils/scaffold-eth";

export const RegisterCompany = () => {
  const { address } = useAccount();
  const [companyName, setCompanyName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  // Contract write function
  const { writeContractAsync: registerCompany } = useScaffoldWriteContract("PaythenaCore");

  // Watch for registration events
  const { data: registrationEvents } = useScaffoldEventHistory({
    contractName: "PaythenaCore",
    eventName: "CompanyRegistered",
    fromBlock: BigInt(0),
  });

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }
    if (!companyName.trim()) {
      notification.error("Company name is required");
      return;
    }

    setIsRegistering(true);
    try {
      await registerCompany({
        functionName: "registerCompany",
        args: [companyName] as const,
      });
      notification.success("Company registered successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      notification.error("Failed to register company");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-10">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Register Company/DAO</h2>
          <form onSubmit={handleRegistration}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Company Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter company name"
                className="input input-bordered w-full"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isRegistering}
                required
              />
            </div>
            <div className="card-actions justify-end mt-4">
              <button 
                type="submit" 
                className={`btn btn-primary ${isRegistering ? "loading" : ""}`}
                disabled={isRegistering || !companyName.trim() || !address}
              >
                {isRegistering ? "Registering..." : "Register"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Show recent registrations */}
      {registrationEvents && registrationEvents.length > 0 && (
        <div className="mt-8 w-96">
          <h3 className="text-lg font-bold mb-4">Recent Registrations</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {registrationEvents.map((event, index) => (
                  <tr key={index}>
                    <td>{event.args.name}</td>
                    <td className="font-mono text-sm">
                      {event.args.company?.toString().substring(0, 6)}...
                      {event.args.company?.toString().substring(38)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};