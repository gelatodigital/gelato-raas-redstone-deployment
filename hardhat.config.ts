import { HardhatUserConfig } from "hardhat/config";

// PLUGINS
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-deploy";
import "@nomiclabs/hardhat-etherscan";
// ================================= TASKS =========================================
// ❗COMMENT IN to use || COMMENT OUT before git push to have CI work


// Process Env Variables
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });


const REDSTONE_DEPLOYER_PK = process.env.REDSTONE_DEPLOYER_PK;


// CAUTION: for deployments put ALL keys in .env
let accounts: string[] = [];
if (
  REDSTONE_DEPLOYER_PK
) {
  accounts = [
    REDSTONE_DEPLOYER_PK
  ];
}



const config: HardhatUserConfig = {
  defaultNetwork: "unreal",// | "zKatana" | "geloptestnet"

  // hardhat-deploy
  namedAccounts: {
    deployer: {
      default: 0,
    },
    // Deploys PriceFeed.sol
    redstoneDeployer: {
      default: "0x903918bB1903714E0518Ea2122aCeBfa27f11b6F",
    },

    // Dev Relay Deployers

  },

  networks: {
    hardhat: {
      forking: {
        url: "https://rpc.unreal.gelato.digital",
        blockNumber:1794
      },
    },

    // Prod

    // Staging
    geloptestnet: {
      accounts,
      chainId: 42069,
      url: "https://rpc.op-testnet.gelato.digital",
    },
    unreal: {
      accounts,
      chainId: 18231,
      url: "https://rpc.unreal.gelato.digital",
    },
    zkatana: {
      accounts,
      chainId: 1261120,
      url: "https://rpc.zkatana.gelato.digital",
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: { enabled: true, runs: 999999 },
          // Some networks don't support opcode PUSH0, we need to override evmVersion
          // See https://stackoverflow.com/questions/76328677/remix-returned-error-jsonrpc2-0-errorinvalid-opcode-push0-id24
          evmVersion: "paris",
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      unreal: 'your API key'
    },
    customChains: [
      {
        network: "unreal",
        chainId: 18231,
        urls: {
          apiURL: "https://unreal.blockscout.com/api",
          browserURL: "https://unreal.blockscout.com"
        }
      }
    ]
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },

};

export default config;
