"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ContributorDashboard } from "~~/components/ContributorDashboard";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface ContributorDetails {
  name: string;
  salary: bigint;
  isActive: boolean;
  exists: boolean;
  companyAddress: string;
  paymentFrequency: bigint;
  nextPayment: bigint;
  lastPayment: bigint;
}

export default function ContributorPage() {
  const { address } = useAccount();
  const router = useRouter();

  // Get company address
  const { data: companies } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getActiveCompanies",
  }) as { data: string[] | undefined };

  // Get contributor details
  const { data: contributorDetails } = useScaffoldReadContract<"PaythenaCore", "debugContributor">({
    contractName: "PaythenaCore",
    functionName: "debugContributor",
    args: [companies?.[0], address],
  }) as { data: ContributorDetails | undefined };

  // Redirect to home if wallet disconnects
  useEffect(() => {
    if (!address) {
      router.push("/");
    }
  }, [address, router]);

  // Debug logging
  useEffect(() => {
    console.log("Debug:", {
      address,
      companyAddress: companies?.[0],
      contributorDetails,
      exists: contributorDetails?.exists,
      isActive: contributorDetails?.isActive
    });
  }, [address, companies, contributorDetails]);

  if (!contributorDetails?.exists || !contributorDetails?.isActive) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 bg-base-100 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>This wallet is not registered as a contributor.</p>
          <p className="mt-2 text-xs opacity-60">Address: {address}</p>
          <p className="mt-1 text-xs opacity-60">Company: {companies?.[0]}</p>
          <button 
            className="btn btn-primary mt-4"
            onClick={() => router.push("/")}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return <ContributorDashboard contributorDetails={contributorDetails} />;
}