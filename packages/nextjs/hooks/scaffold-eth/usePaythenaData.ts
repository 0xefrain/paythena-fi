import { useScaffoldReadContract } from "./useScaffoldReadContract";
import { ContributorInfo, CompanyDetails, PaymentRecord } from "~~/types/paythena";

export const usePaythenaData = (companyAddress: string, contributorAddress?: string) => {
  // Get company details
  const { data: rawCompanyDetails, refetch: refetchCompany } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getCompanyDetails",
    args: [companyAddress],
    watch: true,
    enabled: !!companyAddress,
  });

  // Format company details to match our interface
  const companyDetails = rawCompanyDetails ? {
    name: rawCompanyDetails[0] as string,
    balance: rawCompanyDetails[1] as bigint,
    contributorCount: rawCompanyDetails[2] as bigint,
    isActive: rawCompanyDetails[3] as boolean,
  } : undefined;

  // Get active contributors
  const { data: contributors, refetch: refetchContributors } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getActiveContributors",
    args: [companyAddress],
    watch: true,
    enabled: !!companyAddress && companyDetails?.isActive,
  });

  // Get contributor details if one is selected
  const { data: contributorDetails, refetch: refetchContributor } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getContributorDetails",
    args: [companyAddress, contributorAddress],
    enabled: !!companyAddress && !!contributorAddress && !!contributors?.includes(contributorAddress),
    watch: true,
  });

  // Debug logging
  console.log("PaythenaData:", {
    companyAddress,
    companyDetails,
    contributors,
    contributorAddress,
    contributorDetails
  });

  return {
    companyDetails,
    contributors: Array.isArray(contributors) ? contributors : [],
    contributorDetails,
    refreshData: async () => {
      try {
        await Promise.all([
          refetchCompany(),
          refetchContributors(),
          contributorAddress && refetchContributor(),
        ].filter(Boolean));
      } catch (error) {
        console.error("Refresh error:", error);
      }
    },
  };
}; 