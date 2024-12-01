import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

export const useWalletState = () => {
  const { address, isConnecting, isDisconnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      // Get last connected address from localStorage
      const lastAddress = localStorage.getItem("lastConnectedAddress");

      if (address) {
        // Save current address
        localStorage.setItem("lastConnectedAddress", address);
        setIsLoading(false);
      } else if (lastAddress && isDisconnected && !isConnecting) {
        // If we have a last address but are disconnected, prompt reconnection
        setIsLoading(false);
      } else if (isDisconnected && !isConnecting && !lastAddress) {
        // If completely disconnected and no previous session
        router.push("/");
      }
    }
  }, [address, isDisconnected, isConnecting, router]);

  return {
    address,
    isLoading,
    isConnecting,
    isDisconnected,
    hasLastSession: typeof window !== "undefined" ? !!localStorage.getItem("lastConnectedAddress") : false,
  };
};
