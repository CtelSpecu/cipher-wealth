import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedCipherWealth = await deploy("CipherWealth", {
    from: deployer,
    log: true,
  });

  console.log(`CipherWealth contract: `, deployedCipherWealth.address);
};
export default func;
func.id = "deploy_cipherWealth"; // id required to prevent reexecution
func.tags = ["CipherWealth"];
