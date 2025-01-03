import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import scaffoldConfig from "~~/scaffold.config";

/**
 * wagmi connectors for the wagmi context
 */
export const wagmiConnectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, walletConnectWallet, ledgerWallet, coinbaseWallet, rainbowWallet],
    },
  ],
  {
    appName: "Paythena",
    projectId: scaffoldConfig.walletConnectProjectId,
  },
);
