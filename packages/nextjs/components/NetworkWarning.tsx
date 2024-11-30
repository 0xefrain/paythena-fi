"use client";

import { useEffect } from "react";
import { useWalletClient } from "wagmi";
import { useNetworkColor } from "~~/hooks/scaffold-eth/useNetworkColor";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

export const NetworkWarning = () => {
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();
  const networkColor = useNetworkColor();

  useEffect(() => {
    if (walletClient && walletClient.chain.id !== targetNetwork.id) {
      notification.warning(
        <div className="flex flex-col gap-2">
          <p>
            Your wallet is connected to <span style={{ color: networkColor }}>{walletClient.chain.name}</span>
          </p>
          <p>
            Please switch to <span className="text-primary">{targetNetwork.name}</span> to use Paythena
          </p>
          <button
            className="btn btn-xs btn-primary"
            onClick={async () => {
              try {
                await walletClient.switchChain({ id: targetNetwork.id });
              } catch (error: any) {
                notification.error("Failed to switch network");
              }
            }}
          >
            Switch Network
          </button>
        </div>,
      );
    }
  }, [walletClient, targetNetwork, networkColor]);

  return null;
};
