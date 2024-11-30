import * as chains from "viem/chains";

// Define Ble Testnet
const bleTestnet = {
  id: 52085143,
  name: 'Ble Testnet',
  network: 'ble-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.rpc.ethena.fi'],
      webSocket: ['wss://testnet.rpc.ethena.fi'],
    },
    public: {
      http: ['https://testnet.rpc.ethena.fi'],
      webSocket: ['wss://testnet.rpc.ethena.fi'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://testnet.explorer.ethena.fi' },
  },
} as const satisfies chains.Chain;

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  walletConnectProjectId: string;
};

const scaffoldConfig = {
  // Set Ble Testnet as the only target network
  targetNetworks: [bleTestnet],

  // The interval at which your front-end polls the RPC servers for new data
  pollingInterval: 30000,

  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF",

  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",

} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
