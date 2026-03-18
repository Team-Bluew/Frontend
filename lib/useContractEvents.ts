"use client";

import { useWatchContractEvent } from "wagmi";
import { useState } from "react";
import { formatEther, formatUnits } from "viem";
import { ActivityItem, shortAddr } from "@/lib/amm";
import { DEX_ABI } from "./abi";
import { DEX_ADDRESS } from "./wagmi";

let _id = 0;

export function useContractEvents(): ActivityItem[] {
  const [events, setEvents] = useState<ActivityItem[]>([]);

  function push(item: Omit<ActivityItem, "id">) {
    setEvents((prev) => [{ ...item, id: ++_id }, ...prev].slice(0, 20));
  }

  useWatchContractEvent({
    address: DEX_ADDRESS, abi: DEX_ABI, eventName: "EthToTokenSwap",
    onLogs(logs) {
      logs.forEach((l: any) => push({ type: "EthToTokenSwap", addr: l.args.swapper, a: `${formatEther(l.args.ethInput)} ETH`, b: `${formatUnits(l.args.tokenOutput, 18)} BAL`, time: "just now" }));
    },
  });

  useWatchContractEvent({
    address: DEX_ADDRESS, abi: DEX_ABI, eventName: "TokenToEthSwap",
    onLogs(logs) {
      logs.forEach((l: any) => push({ type: "TokenToEthSwap", addr: l.args.swapper, a: `${formatUnits(l.args.tokensInput, 18)} BAL`, b: `${formatEther(l.args.ethOutput)} ETH`, time: "just now" }));
    },
  });

  useWatchContractEvent({
    address: DEX_ADDRESS, abi: DEX_ABI, eventName: "LiquidityProvided",
    onLogs(logs) {
      logs.forEach((l: any) => push({ type: "LiquidityProvided", addr: l.args.liquidityProvider, a: `${formatEther(l.args.ethInput)} ETH`, b: `${formatUnits(l.args.tokensInput, 18)} BAL`, time: "just now" }));
    },
  });

  useWatchContractEvent({
    address: DEX_ADDRESS, abi: DEX_ABI, eventName: "LiquidityRemoved",
    onLogs(logs) {
      logs.forEach((l: any) => push({ type: "LiquidityRemoved", addr: l.args.liquidityRemover, a: `${formatEther(l.args.ethOutput)} ETH`, b: `${formatUnits(l.args.tokensOutput, 18)} BAL`, time: "just now" }));
    },
  });

  return events;
}
