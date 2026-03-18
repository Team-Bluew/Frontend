"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits, formatUnits } from "viem";
import { ammOut, priceImpact, fmt, deadline, parseContractError } from "@/lib/amm";
import { usePool, TOKEN_SYMBOL } from "@/lib/usePool";
import { DEX_ABI, ERC20_ABI } from "@/lib/abi";
import { DEX_ADDRESS } from "@/lib/wagmi";

type Direction = "e2t" | "t2e";

interface Props {
  slip: number;
  ddl: number;
  onOpenSettings: () => void;
  onNotify: (type: "ok" | "er" | "wn", msg: string) => void;
}

export default function SwapCard({ slip, ddl, onOpenSettings, onNotify }: Props) {
  const { address, isConnected } = useAccount();
  const { ethReserve, tokenReserve, spot, tokenAddr, tokenAllowance, refetch } = usePool();

  const [dir, setDir]     = useState<Direction>("e2t");
  const [inAmt, setInAmt] = useState("");
  const [outAmt, setOutAmt] = useState("");
  const [impact, setImpact] = useState(0);

  const inL  = dir === "e2t" ? "ETH" : TOKEN_SYMBOL;
  const outL = dir === "e2t" ? TOKEN_SYMBOL : "ETH";

  useEffect(() => {
    const v = parseFloat(inAmt);
    if (!v || isNaN(v)) { setOutAmt(""); setImpact(0); return; }
    const [inR, outR] = dir === "e2t" ? [ethReserve, tokenReserve] : [tokenReserve, ethReserve];
    const out = ammOut(v, inR, outR);
    setOutAmt(out.toFixed(6));
    const spotOut = dir === "e2t" ? v * spot : v / spot;
    setImpact(priceImpact(v, out, spotOut));
  }, [inAmt, dir, ethReserve, tokenReserve, spot]);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) { onNotify("ok", "Swap confirmed!"); setInAmt(""); refetch(); }
  }, [isSuccess]);

  async function handleSwap() {
    if (!isConnected) return onNotify("wn", "Connect your wallet first.");
    const v = parseFloat(inAmt);
    if (!v || isNaN(v)) return onNotify("er", "Enter an amount to swap.");

    const outNum = parseFloat(outAmt);
    const minOut = outNum * (1 - slip / 100);
    const dl = deadline(ddl);

    try {
      if (dir === "e2t") {
        writeContract({
          address: DEX_ADDRESS, abi: DEX_ABI,
          functionName: "ethToToken",
          args: [parseUnits(minOut.toFixed(18), 18), dl],
          value: parseEther(v.toString()),
        });
      } else {
        const tokenIn = parseUnits(v.toString(), 18);
        const needsApproval = !tokenAllowance || tokenAllowance < tokenIn;
        if (needsApproval && tokenAddr) {
          writeContract({ address: tokenAddr, abi: ERC20_ABI, functionName: "approve", args: [DEX_ADDRESS, tokenIn] });
          return onNotify("wn", "Approve token spend first, then swap again.");
        }
        writeContract({
          address: DEX_ADDRESS, abi: DEX_ABI,
          functionName: "tokenToEth",
          args: [tokenIn, parseEther(minOut.toFixed(18)), dl],
        });
      }
    } catch (e) {
      onNotify("er", parseContractError(e));
    }
  }

  const impClass = impact < 1 ? "lo" : impact < 5 ? "md" : "hi";
  const outNum   = parseFloat(outAmt);
  const inNum    = parseFloat(inAmt);
  const busy     = isPending || isConfirming;

  return (
    <div className="card anim">
      <div className="ch">
        <span className="ct">Swap</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div className="spot"><span>⬡</span><span>1 ETH = {fmt(spot, 0)} {TOKEN_SYMBOL}</span></div>
          <button className="gear" onClick={onOpenSettings}>⚙ {slip}% · {ddl}m</button>
        </div>
      </div>

      <div className="cb">
        <div className="ti-wrap">
          <div className="ti-label">You Pay</div>
          <div className="ti-row">
            <input type="number" className="ti" placeholder="0.0" value={inAmt} onChange={(e) => setInAmt(e.target.value)} />
            <div className="badge">
              <div className={`icon ${dir === "e2t" ? "eth" : "tkn"}`}>{dir === "e2t" ? "Ξ" : "T"}</div>
              <span className="bname">{inL}</span>
            </div>
          </div>
        </div>

        <button className="arr" onClick={() => { setDir((d) => d === "e2t" ? "t2e" : "e2t"); setInAmt(""); }}>⇅</button>

        <div className="ti-wrap" style={{ background: "rgba(0,0,0,0.18)" }}>
          <div className="ti-label">You Receive</div>
          <div className="ti-row">
            <input type="number" className="ti" placeholder="0.0" value={outAmt} readOnly style={{ color: "var(--dim)" }} />
            <div className="badge">
              <div className={`icon ${dir === "e2t" ? "tkn" : "eth"}`}>{dir === "e2t" ? "T" : "Ξ"}</div>
              <span className="bname">{outL}</span>
            </div>
          </div>
        </div>

        {outAmt && !isNaN(outNum) && inNum > 0 && (
          <div style={{ marginTop: "14px" }}>
            <div className="ir"><span className="il">Rate</span><span className="iv">{dir === "e2t" ? `1 ETH ≈ ${fmt(outNum / inNum, 2)} ${TOKEN_SYMBOL}` : `1 ${TOKEN_SYMBOL} ≈ ${fmt(outNum / inNum, 6)} ETH`}</span></div>
            <div className="ir"><span className="il">Price Impact</span><span className={`imp ${impClass}`}>{impact < 0.01 ? "<0.01" : fmt(impact, 2)}%</span></div>
            <div className="ir"><span className="il">Min. Received ({slip}% slip)</span><span className="iv">{fmt(outNum * (1 - slip / 100), 6)} {outL}</span></div>
            <div className="ir"><span className="il">LP Fee (0.3%)</span><span className="iv">{fmt(inNum * 0.003, 6)} {inL}</span></div>
            <div className="ir"><span className="il">Deadline</span><span className="iv">in {ddl} min</span></div>
          </div>
        )}

        {impact >= 5 && <div className="warn">⚠ High price impact ({fmt(impact, 2)}%) — you may receive significantly less than expected.</div>}

        <button className={`cta ${isConnected ? "pr" : "co"}`} onClick={handleSwap} disabled={busy}>
          {busy ? "Pending…" : isConnected ? "Swap Now" : "Connect Wallet"}
        </button>
      </div>
    </div>
  );
}
