import { createConfig, http } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";

export const wagmiConfig = createConfig({
  chains: scaffoldConfig.targetNetworks,
  connectors: wagmiConnectors,
  transports: {
    [scaffoldConfig.targetNetworks[0].id]: http(),
  },
  ssr: true,
}); 