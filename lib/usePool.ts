"use client";

import { useReadContract, useBalance, useAccount } from "wagmi";
import { DEX_ADDRESS } from "./wagmi";
import { DEX_ABI, ERC20_ABI } from "./abi";
import { formatEther, formatUnits } from "viem";

export const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "BAL";

export function usePool() {
  const { address } = useAccount();

  const { data: totalLiq,  refetch: r1 } = useReadContract({ address: DEX_ADDRESS, abi: DEX_ABI, functionName: "totalLiquidity" });
  const { data: spotRaw,   refetch: r2 } = useReadContract({ address: DEX_ADDRESS, abi: DEX_ABI, functionName: "getSpotPrice" });
  const { data: tokenAddr, refetch: r3 } = useReadContract({ address: DEX_ADDRESS, abi: DEX_ABI, functionName: "token" });
  const { data: userLiq,   refetch: r4 } = useReadContract({ address: DEX_ADDRESS, abi: DEX_ABI, functionName: "getLiquidity", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: ethBal,    refetch: r5 } = useBalance({ address: DEX_ADDRESS });

  const tAddr = tokenAddr as `0x${string}` | undefined;

  const { data: tokenReserveBig, refetch: r6 } = useReadContract({ address: tAddr, abi: ERC20_ABI, functionName: "balanceOf", args: [DEX_ADDRESS], query: { enabled: !!tAddr } });
  const { data: userTokenBal,    refetch: r7 } = useReadContract({ address: tAddr, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!tAddr && !!address } });
  const { data: tokenAllowance,  refetch: r8 } = useReadContract({ address: tAddr, abi: ERC20_ABI, functionName: "allowance", args: address ? [address, DEX_ADDRESS] : undefined, query: { enabled: !!tAddr && !!address } });

  const ethReserve    = ethBal            ? parseFloat(formatEther(ethBal.value))                    : 0;
  const tokenReserve  = tokenReserveBig   ? parseFloat(formatUnits(tokenReserveBig as bigint, 18))   : 0;
  const spot          = spotRaw           ? parseFloat(formatUnits(spotRaw as bigint, 18))            : (ethReserve > 0 ? tokenReserve / ethReserve : 0);
  const totalLiquidity = totalLiq         ? parseFloat(formatUnits(totalLiq as bigint, 18))           : 0;
  const userLiquidity  = userLiq          ? parseFloat(formatUnits(userLiq as bigint, 18))            : 0;

  function refetch() { r1(); r2(); r3(); r4(); r5(); r6(); r7(); r8(); }

  return {
    ethReserve,
    tokenReserve,
    spot,
    totalLiquidity,
    userLiquidity,
    tokenAddr: tAddr,
    userTokenBal: userTokenBal as bigint | undefined,
    tokenAllowance: tokenAllowance as bigint | undefined,
    refetch,
  };
}
