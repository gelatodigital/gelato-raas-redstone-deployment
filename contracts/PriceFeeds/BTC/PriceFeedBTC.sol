// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import {IRedstoneAdapter} from "../../RedStoneBaseContracts/redstone-oracles-monorepo/packages/on-chain-relayer/contracts/core/IRedstoneAdapter.sol";
import {PriceFeedWithoutRounds} from "../../RedStoneBaseContracts/redstone-oracles-monorepo/packages/on-chain-relayer/contracts/price-feeds/without-rounds/PriceFeedWithoutRounds.sol";

contract PriceFeedBTC is PriceFeedWithoutRounds {

  IRedstoneAdapter immutable public adapterAddress;

  constructor(IRedstoneAdapter _adapterAddress){
    adapterAddress = _adapterAddress;
  }

  // This function is added just for testing purposes
  // You should not have a function like this in the real contracts
  // function setPriceFeedAdapter(IRedstoneAdapter _adapterAddress) public {
  //   adapterAddress = _adapterAddress;
  // }

  function getDataFeedId() public view virtual override returns (bytes32) {
    return bytes32("BTC");
  }

  // In production contract we recommend to hardcode the actual address here to avoid
  // additional gas costs related tor reading the address from storage.
  // We also strongly recommend to have some upgradability mechanism for your contracts
  function getPriceFeedAdapter() public view virtual override returns (IRedstoneAdapter) {
    return adapterAddress;
  }
}
