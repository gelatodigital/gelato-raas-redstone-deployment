// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

struct Prices {
  uint256 offChain;
  uint256 onChain;
}

contract SimplePriceFeedConsumer {
  AggregatorV3Interface private priceFeed;
  int256 public latestSavedPrice;
  uint256 public priceId;
  mapping(uint256 => Prices ) public prices;

  constructor(AggregatorV3Interface priceFeed_) {
    priceFeed = priceFeed_;
  }

  function doSomethingWithPrice(uint256 _offChain) public {
    (, int256 price, , , ) = priceFeed.latestRoundData();

    prices[priceId] = Prices(_offChain,uint(price));
    priceId++;
    // We can do whatever logic with the price
    // In this example, we just save it in a storage variable
    latestSavedPrice = price;
  }
}
