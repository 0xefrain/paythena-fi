import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployAutomation: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Get the deployed PaythenaCore address
  const PaythenaCore = await hre.deployments.get("PaythenaCore");
  console.log("\n Found PaythenaCore at:", PaythenaCore.address);

  console.log("\n🤖 Deploying PaythenaAutomation...");
  const paythenaAutomation = await deploy("PaythenaAutomation", {
    from: deployer,
    args: [PaythenaCore.address],
    log: true,
    waitConfirmations: 1,
  });
  console.log("✅ PaythenaAutomation deployed to:", paythenaAutomation.address);

  // Verify on block explorer if not on localhost
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n📝 Verifying PaythenaAutomation on block explorer...");
    
    try {
      await hre.run("verify:verify", {
        address: paythenaAutomation.address,
        constructorArguments: [PaythenaCore.address],
      });
      console.log("✅ Verification successful!");
    } catch (error) {
      console.log("❌ Error verifying contract:", error);
    }
  }
};

export default deployAutomation;
deployAutomation.tags = ["PaythenaAutomation"]; 