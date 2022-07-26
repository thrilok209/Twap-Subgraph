import {
  Address,
  BigInt,
  dataSource,
  DataSourceContext,
  log,
} from "@graphprotocol/graph-ts";
import { Swap } from "../generated/templates/UniswapV3Pool/UniswapV3Pool";
import { UniswapV3Pool } from "../generated/templates";
import { Pool, SwapData } from "../generated/schema";
import { createOrLoadPool, createOrLoadSwapData } from "./uniswap-v-3-factory";

export function handleSwap(event: Swap): void {
  let context = dataSource.context();
  let poolId = context.getString("pool");

  let pool = createOrLoadPool(poolId);
  let swapData = createOrLoadSwapData(
    event.transaction.hash.toHexString() + "#" + poolId + "#" + ((pool.swap).length).toString() 
  );

  let swaps = pool.swap;

  //   swapData.pool = poolId;
  swapData.sender = event.params.sender;
  swapData.receiver = event.params.recipient;
  swapData.origin = event.transaction.from;
  swapData.sqrtPriceX96 = event.params.sqrtPriceX96;
  swapData.tick = BigInt.fromI32(event.params.tick);
  swapData.liquidity = event.params.liquidity;
  swapData.timestamp = event.block.timestamp;
  swapData.blockNumber = event.block.number;

    //cumulative ticks -- stores the cumulative tick data of previous timestamp.
    if (swaps.length == 0) {
      swapData.cumulativeTicks = BigInt.fromI32(0);
    } else {
      let prevSwap = createOrLoadSwapData(swaps[swaps.length - 1]);
      let prevTickTime = prevSwap.timestamp;
      let duration = event.block.timestamp.minus(prevTickTime);
      let prevTick = prevSwap.tick;
      swapData.cumulativeTicks = prevTick.times(duration);
    }


  // if(swaps.length > 0){
  //   for(let i=0;i<swaps.length;i++){
  //     let prevSwap = SwapData.load(swaps[i]);
  //     if (prevSwap != null) {
  //     log.info("Timestamp {} {}: {}", [i.toString(), prevSwap.blockNumber.toString(),(prevSwap.timestamp).toString()]);
  //   }
    
  //   log.info("Pool: {}", [pool.address.toHexString()]);
  // }}
  // log.info("Current timestamp: {}", [(event.block.timestamp).toString()]);
  swaps.push(swapData.id);
  pool.count = pool.count.plus(BigInt.fromI32(1));
  pool.swap = swaps;

  swapData.save();
  pool.save();
}
