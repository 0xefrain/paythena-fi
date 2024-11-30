"use client";

import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const RoleDebug = () => {
  const { address } = useAccount();

  // Get roles
  const { data: companyRole } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "COMPANY_ROLE",
  });

  const { data: contributorRole } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "CONTRIBUTOR_ROLE",
  });

  // Check roles
  const { data: isCompany } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "hasRole",
    args: [companyRole, address],
  });

  const { data: isContributor } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "hasRole",
    args: [contributorRole, address],
  });

  // Get company address for contributor
  const { data: contributorCompany } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "contributorToCompany",
    args: [address],
  });

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-base-300 rounded-lg shadow-xl">
      <h3 className="text-sm font-bold mb-2">Role Debug</h3>
      <div className="text-xs space-y-1">
        <p>Address: {address}</p>
        <p>Company Role: {companyRole}</p>
        <p>Contributor Role: {contributorRole}</p>
        <p>Is Company: {isCompany?.toString()}</p>
        <p>Is Contributor: {isContributor?.toString()}</p>
        <p>Contributor Company: {contributorCompany}</p>
      </div>
    </div>
  );
}; 