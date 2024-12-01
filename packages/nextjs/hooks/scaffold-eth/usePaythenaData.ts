import { useScaffoldReadContract } from "./useScaffoldReadContract";
import { CompanyDetails } from "~~/types/paythena";

interface ContributorDetail {
  nextPayment: bigint;
  isActive: boolean;
  salary: bigint;
  name: string;
  lastProcessedTime: bigint;
}

interface PaythenaDataReturn {
  companyDetails: CompanyDetails;
  contributors: string[];
  contributorDetails: ContributorDetail | undefined;
  refreshData: () => Promise<void>;
}

export const usePaythenaData = (companyAddress: string, contributorAddress?: string): PaythenaDataReturn => {
  // Get company details
  const { data: rawCompanyDetails, refetch: refetchCompany } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getCompanyDetails",
    args: [companyAddress],
  }) as unknown as { data: [string, bigint, bigint, boolean] | undefined; refetch: () => Promise<any> };

  // Format company details to match our interface
  const companyDetails = rawCompanyDetails
    ? {
        name: rawCompanyDetails[0] as string,
        balance: rawCompanyDetails[1] as bigint,
        contributorCount: rawCompanyDetails[2] as bigint,
        isActive: rawCompanyDetails[3] as boolean,
      }
    : { name: "", balance: 0n, contributorCount: 0n, isActive: false };

  // Get active contributors
  const { data: contributors, refetch: refetchContributors } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getActiveContributors",
    args: [companyAddress],
  });

  // Get contributor details if one is selected
  const { data: contributorDetails, refetch: refetchContributor } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getContributorDetails",
    args: [companyAddress, contributorAddress],
  }) as unknown as { data: ContributorDetail | undefined; refetch: () => Promise<any> };

  // Debug logging
  console.log("PaythenaData:", {
    companyAddress,
    companyDetails,
    contributors,
    contributorAddress,
    contributorDetails,
  });

  return {
    companyDetails,
    contributors: Array.isArray(contributors) ? contributors : [],
    contributorDetails,
    refreshData: async () => {
      try {
        await Promise.all(
          [refetchCompany(), refetchContributors(), contributorAddress && refetchContributor()].filter(Boolean),
        );
      } catch (error) {
        console.error("Refresh error:", error);
      }
    },
  };
};
