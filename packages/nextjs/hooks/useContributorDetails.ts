import { useScaffoldReadContract } from "./scaffold-eth";

export const useContributorDetails = (
  companyAddress: string | undefined,
  contributorAddress: string | undefined
) => {
  const { data: details } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "getContributorDetails",
    args: [companyAddress as string, contributorAddress as string],
    enabled: !!companyAddress && !!contributorAddress,
  });

  if (!details) return null;

  const [name, salary, nextPayment, paymentFrequency, isActive, lastProcessedTime] = details as any[];

  return {
    name,
    salary,
    nextPayment,
    paymentFrequency,
    isActive,
    lastProcessedTime,
  };
}; 