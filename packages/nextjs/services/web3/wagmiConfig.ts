import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import scaffoldConfig from "~~/scaffold.config";

export const wagmiConfig = createConfig({
  chains: scaffoldConfig.targetNetworks,
  connectors: [injected(), walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "" })],
  transports: {
    [scaffoldConfig.targetNetworks[0].id]: http(),
  },
  ssr: true,
});
