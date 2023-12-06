

import * as sdk from"@redstone-finance/sdk";
import { WrapperBuilder} from "@redstone-finance/evm-connector"
import { DataPackagesWrapper} from "@redstone-finance/evm-connector/dist/src/wrappers/DataPackagesWrapper"
import { ethers, deployments, network } from "hardhat";
import { PriceFeedAdapterETH, PriceFeedETH,  SimplePriceFeedConsumer,  } from "../../typechain";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import hre from "hardhat";
const getLatestSignedETHPrice = async () => {
  return await sdk.requestDataPackages({
    dataServiceId: "redstone-main-demo",
    uniqueSignersCount: 1,
    dataFeeds: ["ETH"],
    urls: ["https://oracle-gateway-1.b.redstone.finance"],
  });
};

const parsePrice = (value: Uint8Array) => {
  const bigNumberPrice = ethers.BigNumber.from(value);
  return bigNumberPrice.toNumber() / 10 ** 8; // Redstone uses 8 decimals
};

describe("ClassicModelETH", function () {
  let priceFeedAdapter: PriceFeedAdapterETH;
  let priceFeed: PriceFeedETH;
  let priceFeedAdapterAddress: string;
  let priceFeedAddress: string;
  let priceFeedConsumer: SimplePriceFeedConsumer;
  let multicall: Contract;
  let deployer: SignerWithAddress;

  // Set up all contracts
  before(async () => {
    
    [deployer] = await hre.ethers.getSigners()

    
    /// Deploying ETH
    await deployments.fixture()

    priceFeedAddress = (await deployments.get("PriceFeedETH")).address;
    priceFeed = (await ethers.getContractAt(
      "PriceFeedETH",
      priceFeedAddress
    )) as PriceFeedETH;


    priceFeedAdapterAddress = (await deployments.get("PriceFeedAdapterETH")).address;
    priceFeedAdapter = (await ethers.getContractAt(
      "PriceFeedAdapterETH",
      priceFeedAdapterAddress
    )) as PriceFeedAdapterETH;

    /// testing
    const PriceFeedConsumerFactory = await ethers.getContractFactory(
      "SimplePriceFeedConsumer"
    );
    priceFeedConsumer = await PriceFeedConsumerFactory.deploy(
     priceFeed.address
     );

     const multicallAbi =["function aggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes[] returnData)"]
     multicall = await  new Contract("0xcA11bde05977b3631167028862bE2a173976CA11",multicallAbi,deployer)
 
  });


  it.only("Should do a simple independent update", async () => {

    
    let gasPrice = await  hre.ethers.provider.getGasPrice()
    console.log(+gasPrice.toString())

    

    let blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
  
    const dataPackagesResponse = await getLatestSignedETHPrice();
    const wrappedAdapter =
      WrapperBuilder.wrap(priceFeedAdapter).usingDataPackages(
        dataPackagesResponse
      );
    const { dataPackage } = dataPackagesResponse["ETH"]![0];
  
    const parsedPrice = parsePrice(dataPackage.dataPoints[0].value);
    console.log(`Setting ETH price in PriceFeed contract to: ${parsedPrice}`);
    await wrappedAdapter.updateDataFeedsValues(
      dataPackage.timestampMilliseconds
    );
  });

  it("Should read latest price data", async () => {

    const latestRoundData = await priceFeed.latestRoundData();
    console.log(`Latest value the ETH Price Feed: ${latestRoundData.answer}`);
  });

  // This is the example for the Tangible use case
  // Where we want to ensure that the tx is executed with the exactly the same
  // price that the user has in the UI
  it("Should update price and read it in a single transaction", async () => {
    // Check the initial state of the consumer (Tangible) contract
    const initialLatestSavedPrice = await priceFeedConsumer.latestSavedPrice();
    console.log(
      `Initial saved price in the consumer contract (should be zero): ${initialLatestSavedPrice}`
    );

    // Prepare update tx
    const dataPackagesResponse = await getLatestSignedETHPrice();
    const { dataPackage } = dataPackagesResponse["ETH"]![0];
    const parsedPrice = parsePrice(dataPackage.dataPoints[0].value);
    console.log(`User sees in the UI ETH price: ${parsedPrice}`);
    const wrapper = new DataPackagesWrapper(dataPackagesResponse);
    const redstonePayload = await wrapper.getRedstonePayloadForManualUsage(priceFeedConsumer);

    // You can read more about redstone payload structure here: https://docs.redstone.finance/docs/smart-contract-devs/how-it-works#data-packing-off-chain-data-encoding
    console.log(`Redstone payload: ${redstonePayload}`);
    const redstonePayloadWithoutZeroEx = redstonePayload.replaceAll("0x", "");

    // Prepare the call with the prices update
    const callWithPriceUpdateInAdapter = {
      target: priceFeedAdapter.address,
      callData:
        priceFeedAdapter.interface.encodeFunctionData("updateDataFeedsValues", [
          dataPackage.timestampMilliseconds,
        ]) + redstonePayloadWithoutZeroEx,
    };

    let nicePrice = +(parsedPrice*100000000).toFixed(0)

    // Prepare the actual call on the consumer contract (with the business logic)
    const callOnConsumerContract = {
      target: priceFeedConsumer.address,
      callData: priceFeedConsumer.interface.encodeFunctionData(
        "doSomethingWithPrice",[nicePrice]
      ),
    };

    // The user sends a single transaction
    const multicallTx = await multicall.aggregate([
      callWithPriceUpdateInAdapter,
      callOnConsumerContract,
    ]);
    await multicallTx.wait();

    console.log(multicallTx.data)
    console.log(priceFeedConsumer.address)
    const lastPrice = await priceFeedConsumer.prices(0)
    console.log(lastPrice.toString())
    // Printing effects in the consumer contract
    const latestSavedPrice = await priceFeedConsumer.latestSavedPrice();
    console.log(
      `Latest saved price in the consumer contract: ${latestSavedPrice}`
    );
  });
});
