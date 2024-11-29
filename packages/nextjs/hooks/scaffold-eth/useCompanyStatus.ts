import { useScaffoldReadContract } from ".";
import { useAccount } from "wagmi";

interface CompanyDetails {
  name: string;
  balance: bigint;
  totalContributors: bigint;
  isActive: boolean;
}

export const useCompanyStatus = () => {
  const { address } = useAccount();

  const { data: companyDetails, isLoading } = useScaffoldReadContract<"PaythenaCore", "getCompanyDetails">({
    contractName: "PaythenaCore",
    functionName: "getCompanyDetails",
    args: [address],
  }) as { data: CompanyDetails | undefined; isLoading: boolean };

  return {
    isRegistered: companyDetails?.isActive || false,
    companyDetails,
    isLoading,
  };
};