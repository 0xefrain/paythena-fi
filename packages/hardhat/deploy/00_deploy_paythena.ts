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

  console.log("\nDeploying Paythena Protocol with account:", deployer);

  // Deploy MockUSDe
  const mockUsde = await deploy("MockUSDe", {
    from: deployer,
    args: [],
    log: true,
  });

  // Deploy PaythenaStaking
  const paythenaStaking = await deploy("PaythenaStaking", {
    from: deployer,
    args: [mockUsde.address, deployer],
    log: true,
  });

  // Deploy PaythenaLoan
  const paythenaLoan = await deploy("PaythenaLoan", {
    from: deployer,
    args: [mockUsde.address, deployer],
    log: true,
  });

  // Deploy PaythenaCore
  const paythenaCore = await deploy("PaythenaCore", {
    from: deployer,
    args: [mockUsde.address, paythenaStaking.address, paythenaLoan.address],
    log: true,
  });

  // Deploy PaythenaAutomation after PaythenaCore
  await deploy("PaythenaAutomation", {
    from: deployer,
    args: [paythenaCore.address],
    log: true,
  });

  // Optional: Mint some test tokens to deployer
  const mockUsdeContract = await hre.ethers.getContractAt(
    "MockUSDe",
    mockUsde.address,
    await hre.ethers.getSigner(deployer)
  );
  await mockUsdeContract.mint(deployer, hre.ethers.parseEther("1000000"));

  console.log("\nDeployment and setup complete!");
  console.log("\nContract Addresses:");
  console.log("MockUSDe:", mockUsde.address);
  console.log("PaythenaStaking:", paythenaStaking.address);
  console.log("PaythenaLoan:", paythenaLoan.address);
  console.log("PaythenaCore:", paythenaCore.address);
};

export default deployPaythena;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags PaythenaProtocol
deployPaythena.tags = ["PaythenaProtocol"];