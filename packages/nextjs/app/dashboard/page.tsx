"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CompanyDashboard from "~~/components/Dashboard";
import { useWalletState } from "~~/hooks/useWalletState";

const DashboardPage = () => {
  const { isDisconnected, hasLastSession } = useWalletState();
  const router = useRouter();

  useEffect(() => {
    if (isDisconnected && !hasLastSession) {
      router.push("/");
    }
  }, [isDisconnected, hasLastSession, router]);

  return <CompanyDashboard />;
};

export default DashboardPage;