"use client";

import { useAccount } from "wagmi";
import ActivityFeed from "./ActivityFeed";
import { fmt } from "@/lib/amm";
import { usePool, TOKEN_SYMBOL } from "@/lib/usePool";
import { useContractEvents } from "@/lib/useContractEvents";

export default function Sidebar() {
  const { isConnected } = useAccount();
  const { ethReserve, tokenReserve, spot, totalLiquidity, userLiquidity } = usePool();
  const events = useContractEvents();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="card">
        <div className="ch">
          <span className="ct" style={{ fontSize: "13px" }}>Pool</span>
          <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "var(--green)", letterSpacing: "1px" }}>● LIVE</span>
        </div>
        <div className="cb" style={{ padding: "12px 20px 20px" }}>
          <div style={{ marginBottom: "12px" }}>
            <div className="sl">Spot Price</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "22px", fontWeight: "600", color: "var(--text)", marginTop: "4px" }}>
              {fmt(spot, 0)} <span style={{ fontSize: "12px", color: "var(--muted)" }}>{TOKEN_SYMBOL}/ETH</span>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
              {spot > 0 ? fmt(1 / spot, 6) : "–"} ETH/{TOKEN_SYMBOL}
            </div>
          </div>
          <div className="div" />
          {[
            ["ETH Reserve",             `${fmt(ethReserve)} ETH`],
            [`${TOKEN_SYMBOL} Reserve`, fmt(tokenReserve, 0)],
            ["Total LP",                fmt(totalLiquidity, 0)],
          ].map(([l, v]) => (
            <div className="ir" key={l}><span className="il">{l}</span><span className="iv">{v}</span></div>
          ))}
          {isConnected && totalLiquidity > 0 && (
            <>
              <div className="div" />
              <div className="sl">Your Share</div>
              <div className="sbar" style={{ marginTop: "7px" }}>
                <div className="sfill" style={{ width: `${(userLiquidity / totalLiquidity) * 100}%` }} />
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--blue)", marginTop: "5px" }}>
                {fmt((userLiquidity / totalLiquidity) * 100, 2)}% — {fmt(userLiquidity, 0)} LP
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="ch" style={{ marginBottom: "2px" }}><span className="ct" style={{ fontSize: "13px" }}>Activity</span></div>
        <div className="cb" style={{ padding: "10px 18px 18px" }}>
          <ActivityFeed items={events.slice(0, 5)} compact />
        </div>
      </div>
    </div>
  );
}
