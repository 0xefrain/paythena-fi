"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const AccessControl = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();

  // Get roles
  const { data: companyRole } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "COMPANY_ROLE",
    enabled: isConnected,
  });

  const { data: contributorRole } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "CONTRIBUTOR_ROLE",
    enabled: isConnected,
  });

  // Check roles
  const { data: isCompany } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "hasRole",
    args: [companyRole, address],
    enabled: isConnected && !!companyRole && !!address,
  });

  const { data: isContributor } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "hasRole",
    args: [contributorRole, address],
    enabled: isConnected && !!contributorRole && !!address,
  });

  // Handle initial wallet connection
  useEffect(() => {
    if (isConnected && address) {
      console.log("Wallet connected, checking roles...");
    }
  }, [isConnected, address]);

  // Handle role-based routing
  useEffect(() => {
    console.log("Access Control State:", {
      pathname,
      isConnected,
      isCompany,
      isContributor,
      address
    });

    if (!isConnected || !address) return;

    // Wait for role data to be loaded
    if (isCompany === undefined || isContributor === undefined) return;

    // Skip for public pages only if no role is detected
    if ((pathname === "/" || pathname === "/register") && !isCompany && !isContributor) {
      return;
    }

    // Handle contributor access
    if (isContributor) {
      console.log("Contributor detected, redirecting to contributor dashboard");
      if (pathname !== "/contributor") {
        window.location.href = "/contributor";
      }
      return;
    }

    // Handle company access
    if (isCompany) {
      console.log("Company detected, redirecting to company dashboard");
      if (pathname !== "/company") {
        window.location.href = "/company";
      }
      return;
    }

    // No roles - redirect to register
    if (!isCompany && !isContributor && pathname !== "/register") {
      notification.info("Please register first");
      window.location.href = "/register";
    }

  }, [isConnected, isCompany, isContributor, pathname, address]);

  return <>{children}</>;
}; 