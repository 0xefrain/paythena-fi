import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the Paythena Protocol contracts
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployPaythena: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\nDeploying Paythena Protocol to Ble Testnet with account:", deployer);

  try {
    // First deploy PaythenaStaking
    console.log("\n📄 Deploying PaythenaStaking...");
    const paythenaStaking = await deploy("PaythenaStaking", {
      from: deployer,
      args: [deployer], // Admin address
      log: true,
      waitConfirmations: 1,
    });
    console.log("✅ PaythenaStaking deployed to:", paythenaStaking.address);

    // Then deploy PaythenaLoan
    console.log("\n📄 Deploying PaythenaLoan...");
    const paythenaLoan = await deploy("PaythenaLoan", {
      from: deployer,
      args: [deployer], // Admin address
      log: true,
      waitConfirmations: 1,
    });
    console.log("✅ PaythenaLoan deployed to:", paythenaLoan.address);

    // Finally deploy PaythenaCore with the addresses of Staking and Loan contracts
    console.log("\n📄 Deploying PaythenaCore...");
    const paythenaCore = await deploy("PaythenaCore", {
      from: deployer,
      args: [paythenaStaking.address, paythenaLoan.address],
      log: true,
      waitConfirmations: 1,
    });
    console.log("✅ PaythenaCore deployed to:", paythenaCore.address);

    // Log all deployed addresses
    console.log("\n🎉 Deployment Complete! Contract Addresses:");
    console.log("===========================================");
    console.log("PaythenaStaking:", paythenaStaking.address);
    console.log("PaythenaLoan:", paythenaLoan.address);
    console.log("PaythenaCore:", paythenaCore.address);
    console.log("USDe Token:", "0x426E7d03f9803Dd11cb8616C65b99a3c0AfeA6dE");
    console.log("sUSDe Token:", "0x80f9Ec4bA5746d8214b3A9a73cc4390AB0F0E633");
    console.log("===========================================");

    // Verify on block explorer if not on localhost
    if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
      console.log("\n📝 Verifying contracts on block explorer...");
      
      try {
        await hre.run("verify:verify", {
          address: paythenaStaking.address,
          constructorArguments: [deployer],
        });

        await hre.run("verify:verify", {
          address: paythenaLoan.address,
          constructorArguments: [deployer],
        });

        await hre.run("verify:verify", {
          address: paythenaCore.address,
          constructorArguments: [paythenaStaking.address, paythenaLoan.address],
        });

        console.log("✅ All contracts verified successfully!");
      } catch (error) {
        console.log("❌ Error verifying contracts:", error);
      }
    }

  } catch (error) {
    console.error("❌ Error during deployment:", error);
    throw error;
  }
};

export default deployPaythena;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags PaythenaProtocol
deployPaythena.tags = ["PaythenaProtocol"];