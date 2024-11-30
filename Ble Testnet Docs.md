**Getting Started with Ble Testnet** 

The Ethena Network is hosting Ble testnet during the hackathon in partnership with Conduit. 

**Access Ble Testnet from your Favorite Wallet** 

| Chain Name  | Ble Testnet |
| ----- | ----- |
| Chain ID  | 52085143 |
| RPC URL  | https://testnet.rpc.ethena.fi |
| WS URL  | wss://testnet.rpc.ethena.fi |
| Currency Symbol  | ETH |
| Block Explorer  | https://testnet.explorer.ethena.fi/ |

**Fund Your Wallet** 

1\. If you have funds on Sepolia use the bridge to move ETH or USDe from Ethereum Sepolia Testnet. 

2\. If you need an airdrop use the faucet to get some ETH and USDe directly on Ble Testnet. 

**Technical Information** 

**EVM Equivalence** 

The Ble testnet is designed to be fully EVM compatible with only small changes to the standard Ethereum Protocol. Read more about these differences between the OP Stack and Ethereum mainnet in the OP Stack Docs. 

| Parameter  | Ble Testnet  | OP Mainnet  | Ethereum |
| ----- | ----- | ----- | ----- |
| Block time (seconds)  | 2  | 2  | 12 |
| Block gas limit  | 30,000,000  | 30,000,000  | 30,000,000 |
| Block gas target  | 5,000,000  | 5,000,000  | 15,000,000 |
| EIP-1559 elasticity multiplier  | 6  | 6  | 2 |
| EIP-1559 denominator  | 250  | 250  | 8 |

**Contract Addresses**

| Contract Name  | Chain  | Address |
| ----- | ----- | :---: |
| USDe  | Sepolia  | 0xf805ce4F96e0EdD6f0b6cd4be22B34b92373d696 |
| USDe OFT Adapter  | Sepolia  | 0x162cc96D5E528F3E5Ce02EF3847216a917ba55bb |
| USDe OFT  | Ble Testnet  | 0x426E7d03f9803Dd11cb8616C65b99a3c0AfeA6dE |

sUSDe Sepolia 0x1B6877c6Dac4b6De4c5817925DC40E2BfdAFc01b 

| sUSDe OFT Adapter  | Sepolia  | 0xb881F50b83ca2D83cE43327D41DEe42Ab8Efe8dC |
| ----- | ----- | :---: |
| sUSDe OFT  | Ble Testnet  | 0x80f9Ec4bA5746d8214b3A9a73cc4390AB0F0E633 |

**USDe and sUSDe interactions** 

In this section you can find instructions on how USDe and sUSDe interact with each other. We use the cast tool found in Foundry for examples. You can install cast (and the whole Foundry suite) from here. 

**Stake USDe, Receive sUSDe** 

1\. First you need to approve the sUSDe contract to spend USDe on your behalf. If you don't have USDe tokens yet, you can get some from the faucet. Remember to bridge your USDe to Sepolia as the staking mechanism is only available there. We have a bridge for USDe available here. The following example will approve 

sUSDe to spend 1 USDe on your behalf: 

cast send \--rpc-url https://ethereum-sepolia-rpc.publicnode.com \--interactive 0xf805ce4F96e0EdD6f0b6cd4be22B34b92373d696 "approve(address, uint256)" "0x1B6877c6Dac4b6De4c5817925DC40E2BfdAFc01b" 1000000000000000000 

2\. Once you have approved sUSDe to spend USDe on your behalf, you can now stake your USDe by calling the deposit(uint256, address) method on the sUSDe contract. The first parameter is the amount of USDe you want to stake and the scond parameter is the address that will receive the appropriate sUSDe back. 

cast send \--rpc-url https://ethereum-sepolia-rpc.publicnode.com \--interactive 0x1B6877c6Dac4b6De4c5817925DC40E2BfdAFc01b "deposit(uint256, address)" 1000000000000000000 "\<your\_address\_here\>" 

**Unstake sUSDe, receive USDe** 

The unstaking process has a cooldown mechanism. On the Sepolia Testnet sUSDe has a 1 hour cooldown you can observe with the following command: 

cast call \--rpc-url https://ethereum-sepolia-rpc.publicnode.com 

0x1B6877c6Dac4b6De4c5817925DC40E2BfdAFc01b "cooldownDuration()" 

This returns 0x0000000000000000000000000000000000000000000000000000000000000e10 which correspondes to 3600 i.e. the number of seconds in 1 hour. 

**Initiating the unstaking cooldown** 

1\. There are two methods for initiating a cooldown cooldownShares(uint256) or cooldownAssets(uint256) . Note that you cannot cancel a cooldown once initiated and need to wait for the whole cooldownDuration before being able to move your funds. 

a. cooldownShares(uint256) takes in a parameter that represents the amount of sUSDe to initiate a cooldown for. At the end of the cooldown you will receive USDe with respect to the number of sUSDe specified when calling this function. The following command will initiate the cooldown for 1 sUSDe:  
cast send \--rpc-url https://ethereum-sepolia-rpc.publicnode.com \--interactive 0x1B6877c6Dac4b6De4c5817925DC40E2BfdAFc01b "cooldownShares(uint256)" 1000000000000000000 

b. cooldownAssets(uint256) takes in a parameter that represents the amount of USDe to initiate a cooldown for. At the end of the cooldown you will unstake sUSDe with respect to the number of USDe specified when calling this function. The following command will initiate the cooldown for 1 USDe: 

cast send \--rpc-url https://ethereum-sepolia-rpc.publicnode.com \--interactive 0x1B6877c6Dac4b6De4c5817925DC40E2BfdAFc01b "cooldownAssets(uint256)" 1000000000000000000 

2\. At the end of the cooldownDuration you need to call the unstake(address) method. The address parameter represents the address that will receive the unstaked USDe. The following command initiates the unstaking feature: 

cast send \--rpc-url https://ethereum-sepolia-rpc.publicnode.com \--interactive 0x1B6877c6Dac4b6De4c5817925DC40E2BfdAFc01b "unstake(address)" " 

\<your\_address\_here\>" 

**How does sUSDe accrue rewards?** 

Ethena calls the transferInRewards() function which transfers in USDe into the sUSDe contract, without receiving anything in return. This mechanism means that the value of sUSDe increases over time with respect to USDe because the amount of sUSDe does not change when calling this function. An example transaction can be seen here. 

**Tools** 

**Account Abstraction** 

ZeroDev is a chain-abstracted smart account for building user-friendly Web3 experiences. Get started by reading their docs. 

**Block Explorers** 

Blockscout provides an explorer to help view, verify and interact with smart contracts. Visit the Blockscout docs. 

Ble Testnet Explorer \- https://testnet.explorer.ethena.fi/ 

**Bridges** 

Superbridge enables bridging ETH and USDe to and from Ethereum L1 to Ble Testnet L2. Ble Testnet Bridge \- https://network.ethena.fi/bridge 

**Cross-Chain** 

LayerZero is a technology that enables applications to move data across blockchains, supporting censorship-resistant messages and permissionless development through immutable smart contracts.

| Network Name  | EID  | Endpoint Address |
| :---: | :---: | :---: |

Ble Testnet 40330 0x6Ac7bdc07A0583A362F1497252872AE6c0A5F5B8 

For the full list of supported networks and configurations, check out the Deployed Endpoints from LayerZero. For more information, see the LayerZero V2 Docs. 

**Data Indexers** 

GoldSky is the go-to data indexer for web3 builders, offering high-performance subgraph hosting and real-time data pipelines. To get started, sign up to GoldSky, or learn more with the quickstart. 

Index Supply provides an SQL-like interface to blockchains. Combined with its "Live Query" feature you can build responsive web UIs to display complex information in a digestable format. Check out this cool query we ran on the Ble Testnet to track incoming and outgoing transfers for a specific account. 

**Development Tools** 

OpenZeppelin provides tools for building, securing, and operating on-chain applications at any scale. Get started writing solidity smart contracts that utilize OpenZeppelin libraries by checking out the OpenZeppelin Docs. 

**Faucets** 

The Ble Testnet faucet provides a drip of testnet ETH and USDe directly onto the Ble Testnet. 

**Node Providers** 

Conduit provides JSON-RPC access for the Ble Testnet. Sign up to Conduit here for free to get started. Search for ble-testnet on the Browse Networks page and click on “Get API Key” for complete instructions. 

**Oracles** 

Pyth Network is a decentralized oracle solution that provides high-fidelity, real-time financial market data to blockchain networks and applications. Leveraging data from top-tier financial institutions, Pyth aims to enhance the accuracy and speed of dApps by offering ultra-low-latency price feeds. This guide shows you how to use the Pyth feeds. 

The Conduit VRF oracle is a tool for generating random, tamper-proof values in smart contracts. Learn more on how to integrate with the Dapp by checking out these docs.