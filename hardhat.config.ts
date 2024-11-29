import "hardhat-deploy";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  // ... other config
  namedAccounts: {
    deployer: {
      default: 0, // First account by default
    },
  },
}; 