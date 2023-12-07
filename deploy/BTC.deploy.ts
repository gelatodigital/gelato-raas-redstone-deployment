import { deployments, getNamedAccounts } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { sleep } from "../src/utils";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  const {
    deployer:hardhatAccount,
    redstoneDeployer
  } = await getNamedAccounts();

  
  const isHardhat = hre.network.name === "hardhat";
  const isDevEnv = hre.network.name.endsWith("Dev");

  let deployer: string;

  if (isHardhat) {
    deployer = hardhatAccount;
  } else {
    console.log(
      `\nDeploying PriceFeed MOCK to ${hre.network.name}. Hit ctrl + c to abort`
    );
    console.log(`\n IS DEV ENV: ${isDevEnv} \n`);

    deployer = redstoneDeployer

    await sleep(5000);
    }




const adapter = await deploy("PriceFeedAdapterBTC", {
  from: deployer,
  proxy: {
    proxyContract: "EIP173Proxy",
  },
  args: [],
  log: true,
});



  await deploy("PriceFeedBTC", {
    from: deployer,
    proxy: {
      proxyContract: "EIP173Proxy",
    },
    args: [adapter.address],
    log: true,
  });





};

// func.skip = async (hre: HardhatRuntimeEnvironment) => {
//   return hre.network.name !== "hardhat";
// };

func.tags = ["BTC"];

export default func;
