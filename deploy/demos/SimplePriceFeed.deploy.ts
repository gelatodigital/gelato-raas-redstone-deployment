import { deployments, getNamedAccounts } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { sleep } from "../../src/utils";

import { IEIP173Proxy } from "../../typechain";
import {
  impersonateAccount,
  setBalance,
} from "@nomicfoundation/hardhat-network-helpers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  const { deployer: hardhatAccount, redstoneDeployer } =
    await getNamedAccounts();

  const isHardhat = hre.network.name === "hardhat";
  const isDevEnv = hre.network.name.endsWith("Dev");

  let deployer: string;

  if (isHardhat) {
    deployer = hardhatAccount;
  } else {
    console.log(
      `\nDeploying GelatoRelay to ${hre.network.name}. Hit ctrl + c to abort`
    );
    console.log(`\n IS DEV ENV: ${isDevEnv} \n`);

    deployer = redstoneDeployer;

    await sleep(5000);
  }

  const feed = "0xD35c5551F3f63FF2992754db33165b11E81dAA73";

  await deploy("SimplePriceFeedConsumer", {
    from: deployer,
    args: [feed],
    log: true,
  });

  // For local testing we want to upgrade the forked
  // instance of gelatoRelay to our locally deployed implementation
  if (isHardhat) {
    // const gelatoRelayProxy = (await hre.ethers.getContractAt(
    //   "IEIP173Proxy",
    //   gelatoRelay
    // )) as IEIP173Proxy;
    // const gelatoRelayOwnerAddr = await gelatoRelayProxy.owner();
    // await impersonateAccount(gelatoRelayOwnerAddr);
    // await setBalance(gelatoRelayOwnerAddr, hre.ethers.utils.parseEther("1"));
    // const gelatoRelayOwner = await hre.ethers.getSigner(gelatoRelayOwnerAddr);
    // await gelatoRelayProxy
    //   .connect(gelatoRelayOwner)
    //   .upgradeTo(
    //     (
    //       await deployments.get("PriceFeedMockDemo_Implementation")
    //     ).address,
    //     { gasLimit: 1_000_000 }
    //   );
  }
};

// func.skip = async (hre: HardhatRuntimeEnvironment) => {
//   return hre.network.name !== "hardhat";
// };

func.tags = ["SimplePriceFeedConsumer"];

export default func;
