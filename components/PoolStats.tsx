"use client";

import { useAccount } from "wagmi";
import ActivityFeed from "./ActivityFeed";
import { fmt } from "@/lib/amm";
import { usePool, TOKEN_SYMBOL } from "@/lib/usePool";
import { useContractEvents } from "@/lib/useContractEvents";

export default function PoolStats() {
  const { isConnected } = useAccount();
  const { ethReserve, tokenReserve, spot, totalLiquidity, userLiquidity } = usePool();
  const events = useContractEvents();
  const userPct = totalLiquidity > 0 ? (userLiquidity / totalLiquidity) * 100 : 0;

  return (
    <div className="anim">
      <div className="card" style={{ marginBottom: "14px" }}>
        <div className="ch">
          <span className="ct">Pool Stats</span>
          <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "var(--green)", letterSpacing: "1px" }}>● LIVE</span>
        </div>
        <div className="cb">
          <div className="sgrid">
            {[
              ["ETH Reserve",             fmt(ethReserve),    "ETH"],
              [`${TOKEN_SYMBOL} Reserve`, fmt(tokenReserve, 0), TOKEN_SYMBOL],
              ["Spot Price",              fmt(spot, 0),        `${TOKEN_SYMBOL}/ETH`],
              ["Total LP",                fmt(totalLiquidity, 0), "tokens"],
            ].map(([l, v, s]) => (
              <div className="sc" key={String(l)}>
                <div className="sl">{l}</div>
                <div className="sv">{v}</div>
                <div className="ss">{s}</div>
              </div>
            ))}
          </div>

          {isConnected && (
            <>
              <div className="div" />
              <div className="sl" style={{ marginBottom: "8px" }}>Your Position</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "17px", color: "var(--blue)" }}>{fmt(userLiquidity, 0)} LP</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--dim)" }}>{fmt(userPct, 2)}% of pool</span>
              </div>
              <div className="sbar">
                <div className="sfill" style={{ width: `${userPct}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--mono)", color: "var(--muted)" }}>
                <span>≈ {fmt((userLiquidity / totalLiquidity) * ethReserve, 4)} ETH</span>
                <span>≈ {fmt((userLiquidity / totalLiquidity) * tokenReserve, 0)} {TOKEN_SYMBOL}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="ch" style={{ marginBottom: "2px" }}><span className="ct">Recent Activity</span></div>
        <div className="cb"><ActivityFeed items={events} suffix=" ago" /></div>
      </div>
    </div>
  );
}
