"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const RoleGuard = ({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole: "COMPANY_ROLE" | "CONTRIBUTOR_ROLE";
}) => {
  const { address } = useAccount();

  // Get role hash
  const { data: roleHash } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: requiredRole,
  });

  // Check if address has role
  const { data: hasRole } = useScaffoldReadContract({
    contractName: "PaythenaCore",
    functionName: "hasRole",
    args: [roleHash, address],
  });

  useEffect(() => {
    if (address && roleHash && hasRole === false) {
      notification.error("Access Denied: You don't have the required role");
      const redirectPath = requiredRole === "CONTRIBUTOR_ROLE" ? "/company" : "/contributor";
      window.location.href = redirectPath;
    }
  }, [address, roleHash, hasRole, requiredRole]);

  if (!address || !roleHash || hasRole === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You don't have the required role to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 