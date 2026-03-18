"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { parseEther, parseUnits } from "viem";
import { sepolia } from "wagmi/chains";
import { fmt, deadline, parseContractError } from "@/lib/amm";
import { usePool, TOKEN_SYMBOL } from "@/lib/usePool";
import { DEX_ABI, ERC20_ABI } from "@/lib/abi";
import { DEX_ADDRESS, TOKEN_ADDRESS } from "@/lib/wagmi";

type LiqTab = "add" | "remove" | "init";

interface Props {
  ddl: number;
  onNotify: (type: "ok" | "er" | "wn", msg: string) => void;
}

export default function LiquidityCard({ ddl, onNotify }: Props) {
  const { isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { ethReserve, tokenReserve, spot, totalLiquidity, userLiquidity, tokenAddr, tokenAllowance, refetch } = usePool();

  async function ensureSepolia() {
    if (chainId !== sepolia.id) await switchChainAsync({ chainId: sepolia.id });
  }

  const [liqTab, setLiqTab]     = useState<LiqTab>("add");
  const [liqEth, setLiqEth]     = useState("");
  const [liqTok, setLiqTok]     = useState("");
  const [removeAmt, setRemoveAmt] = useState(0);
  const [initEth, setInitEth]   = useState("");
  const [initTok, setInitTok]   = useState("");

  useEffect(() => {
    const v = parseFloat(liqEth);
    if (!v || isNaN(v)) { setLiqTok(""); return; }
    setLiqTok((v * spot).toFixed(2));
  }, [liqEth, spot]);

  const ethOut = totalLiquidity > 0 ? (removeAmt / totalLiquidity) * ethReserve : 0;
  const tokOut = totalLiquidity > 0 ? (removeAmt / totalLiquidity) * tokenReserve : 0;
  const lpMint = liqEth && ethReserve > 0 ? fmt((parseFloat(liqEth) / ethReserve) * totalLiquidity, 2) : "–";

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const busy = isPending || isConfirming;

  useEffect(() => {
    if (writeError) {
      console.error("[writeContract error]", writeError);
      onNotify("er", parseContractError(writeError));
      pendingAction.current = null;
    }
  }, [writeError]);

  // Stores the action to auto-fire after an approval confirms
  const pendingAction = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isSuccess) {
      if (pendingAction.current) {
        pendingAction.current();
        pendingAction.current = null;
        onNotify("wn", "Approval confirmed — submitting transaction…");
      } else {
        onNotify("ok", "Transaction confirmed!");
        setLiqEth("");
        setRemoveAmt(0);
        refetch();
      }
    }
  }, [isSuccess]);

  function approveAndThen(tokenAddr: `0x${string}`, amount: bigint, then: () => void) {
    pendingAction.current = then;
    try {
      writeContract({ address: tokenAddr, abi: ERC20_ABI, functionName: "approve", args: [DEX_ADDRESS, amount], chainId: sepolia.id });
    } catch (e) {
      pendingAction.current = null;
      console.error("[approveAndThen] error:", e);
      onNotify("er", parseContractError(e));
    }
  }

  async function handleAdd() {
    if (!isConnected) return onNotify("wn", "Connect your wallet first.");
    await ensureSepolia();
    const ethVal = parseFloat(liqEth);
    if (!ethVal) return onNotify("er", "Enter ETH amount.");
    const ethBig = parseEther(liqEth);
    const maxTok = parseUnits((parseFloat(liqTok) * 1.01).toFixed(18), 18);
    const dl = deadline(ddl);
    const tokBig = parseUnits(liqTok, 18);
    const needsApproval = !tokenAllowance || tokenAllowance < tokBig;
    if (needsApproval && tokenAddr) {
      return approveAndThen(TOKEN_ADDRESS, maxTok, () =>
        writeContract({ address: DEX_ADDRESS, abi: DEX_ABI, functionName: "deposit", args: [maxTok, dl], value: ethBig, chainId: sepolia.id })
      );
    }
    try {
      writeContract({ address: DEX_ADDRESS, abi: DEX_ABI, functionName: "deposit", args: [maxTok, dl], value: ethBig, chainId: sepolia.id });
    } catch (e) { onNotify("er", parseContractError(e)); }
  }

  async function handleRemove() {
    if (!isConnected) return onNotify("wn", "Connect your wallet first.");
    await ensureSepolia();
    if (!removeAmt) return onNotify("er", "Select LP amount to remove.");
    const amtBig = parseEther(removeAmt.toFixed(18));
    const minEthStr = (ethOut * 0.99).toLocaleString("fullwide", { maximumFractionDigits: 18, useGrouping: false });
    const minTokStr = (tokOut * 0.99).toLocaleString("fullwide", { maximumFractionDigits: 18, useGrouping: false });
    const minEth = parseEther(minEthStr);
    const minTok = parseUnits(minTokStr, 18);
    const dl = deadline(ddl);
    try {
      writeContract({ address: DEX_ADDRESS, abi: DEX_ABI, functionName: "withdraw", args: [amtBig, minEth, minTok, dl], chainId: sepolia.id });
    } catch (e) { onNotify("er", parseContractError(e)); }
  }

  async function handleInit() {
    if (!isConnected) return onNotify("wn", "Connect your wallet first.");
    await ensureSepolia();
    if (!initEth || !initTok || parseFloat(initEth) <= 0 || parseFloat(initTok) <= 0)
      return onNotify("er", "Enter both initial ETH and token amounts.");
    const ethBig = parseEther(initEth);
    const tokBig = parseUnits(initTok, 18);
    const needsApproval = !tokenAllowance || tokenAllowance < tokBig;
    if (needsApproval) {
      return approveAndThen(TOKEN_ADDRESS, tokBig, () => {
        writeContract({ address: DEX_ADDRESS, abi: DEX_ABI, functionName: "init", args: [tokBig], value: ethBig, chainId: sepolia.id });
      });
    }
    console.log("[init] sufficient allowance, firing init directly…");
    try {
      writeContract({ address: DEX_ADDRESS, abi: DEX_ABI, functionName: "init", args: [tokBig], value: ethBig, chainId: sepolia.id });
    } catch (e) { onNotify("er", parseContractError(e)); }
  }

  const userLiqDisplay = fmt(userLiquidity, 0);
  const userPct = totalLiquidity > 0 ? (userLiquidity / totalLiquidity) * 100 : 0;

  return (
    <div className="card anim">
      <div className="ch">
        <span className="ct">Liquidity</span>
        <div className="spot"><span>{fmt(ethReserve)} ETH / {fmt(tokenReserve, 0)} {TOKEN_SYMBOL}</span></div>
      </div>
      <div className="cb">
        <div className="ltabs">
          {(["add", "remove", "init"] as LiqTab[]).map((t) => (
            <button key={t} className={`lt ${liqTab === t ? "on" : ""}`} onClick={() => setLiqTab(t)}>
              {t === "init" ? "Init Pool" : t}
            </button>
          ))}
        </div>

        {liqTab === "add" && (
          <div className="anim">
            <div style={{ marginBottom: "10px" }}>
              <div className="ti-wrap">
                <div className="ti-label">ETH Amount</div>
                <div className="ti-row">
                  <input type="number" className="ti" placeholder="0.0" value={liqEth} onChange={(e) => setLiqEth(e.target.value)} />
                  <div className="badge"><div className="icon eth">Ξ</div><span className="bname">ETH</span></div>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: "14px" }}>
              <div className="ti-wrap">
                <div className="ti-label">Required {TOKEN_SYMBOL} (auto-computed)</div>
                <div className="ti-row">
                  <input type="number" className="ti" placeholder="0.0" value={liqTok} readOnly style={{ color: "var(--dim)" }} />
                  <div className="badge"><div className="icon tkn">T</div><span className="bname">{TOKEN_SYMBOL}</span></div>
                </div>
              </div>
            </div>
            <div className="div" />
            {[
              ["LP Tokens Minted",  <span key="lp" style={{ color: "var(--green)", fontFamily: "var(--mono)", fontSize: "11px" }}>{lpMint}</span>],
              ["Pool Share Gained", liqEth && ethReserve > 0 ? `${fmt((parseFloat(liqEth) / ethReserve) * 100, 2)}%` : "–"],
              ["Deadline",          `in ${ddl} min`],
            ].map(([l, v]) => (
              <div className="ir" key={String(l)}><span className="il">{l}</span><span className="iv">{v}</span></div>
            ))}
            <button className={`cta ${isConnected ? "gr" : "co"}`} onClick={handleAdd} disabled={busy}>
              {busy ? "Pending…" : isConnected ? "Add Liquidity" : "Connect Wallet"}
            </button>
          </div>
        )}

        {liqTab === "remove" && (
          <div className="anim">
            <label className="flabel">LP Amount to Burn</label>
            <div style={{ fontFamily: "var(--mono)", fontSize: "26px", fontWeight: "600", color: "var(--blue)", margin: "6px 0" }}>
              {fmt(removeAmt, 0)} LP
            </div>
            <div style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--muted)", marginBottom: "12px" }}>
              Balance: {userLiqDisplay} LP ({fmt(userPct, 2)}% of pool)
            </div>
            <div style={{ marginBottom: "6px" }}>
              <input type="range" min="0" max={userLiquidity} step="1"
                value={removeAmt} onChange={(e) => setRemoveAmt(Number(e.target.value))}
                style={{ "--pct": `${userLiquidity > 0 ? (removeAmt / userLiquidity) * 100 : 0}%` } as React.CSSProperties} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--mono)", color: "var(--muted)", marginBottom: "14px" }}>
              {["0", "25%", "50%", "75%", "MAX"].map((l) => <span key={l}>{l}</span>)}
            </div>
            <div className="div" />
            {[
              ["ETH to Receive",            <span key="e" style={{ color: "var(--blue)" }}>{fmt(ethOut, 6)} ETH</span>],
              [`${TOKEN_SYMBOL} to Receive`, <span key="t" style={{ color: "var(--purple2)" }}>{fmt(tokOut, 2)} {TOKEN_SYMBOL}</span>],
              ["Deadline",                   `in ${ddl} min`],
            ].map(([l, v]) => (
              <div className="ir" key={String(l)}><span className="il">{l}</span><span className="iv">{v}</span></div>
            ))}
            <button className={`cta ${isConnected ? "dr" : "co"}`} onClick={handleRemove} disabled={busy || !removeAmt}>
              {busy ? "Pending…" : isConnected ? "Remove Liquidity" : "Connect Wallet"}
            </button>
          </div>
        )}

        {liqTab === "init" && (
          <div className="anim">
            <div className="ibanner">
              <strong style={{ color: "var(--blue)", fontFamily: "var(--mono)" }}>⬡ One-time action</strong><br />
              Initializing the pool sets the opening price and seeds both reserves. This action is irreversible
              and can only be done once. The ratio of ETH:{TOKEN_SYMBOL} you provide becomes the starting spot price.
            </div>
            <div style={{ marginBottom: "10px" }}>
              <div className="ti-wrap">
                <div className="ti-label">Initial ETH</div>
                <div className="ti-row">
                  <input type="number" className="ti" placeholder="0.0" value={initEth} onChange={(e) => setInitEth(e.target.value)} />
                  <div className="badge"><div className="icon eth">Ξ</div><span className="bname">ETH</span></div>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: "14px" }}>
              <div className="ti-wrap">
                <div className="ti-label">Initial {TOKEN_SYMBOL}</div>
                <div className="ti-row">
                  <input type="number" className="ti" placeholder="0.0" value={initTok} onChange={(e) => setInitTok(e.target.value)} />
                  <div className="badge"><div className="icon tkn">T</div><span className="bname">{TOKEN_SYMBOL}</span></div>
                </div>
              </div>
            </div>
            {initEth && initTok && parseFloat(initEth) > 0 && (
              <div className="ir">
                <span className="il">Opening Price</span>
                <span className="iv">1 ETH = {fmt(parseFloat(initTok) / parseFloat(initEth), 2)} {TOKEN_SYMBOL}</span>
              </div>
            )}
            <button className={`cta ${isConnected ? "pr" : "co"}`} onClick={handleInit} disabled={busy}>
              {busy ? "Pending…" : isConnected ? "Initialize Pool" : "Connect Wallet"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
