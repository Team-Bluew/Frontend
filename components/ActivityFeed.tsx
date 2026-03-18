"use client";

import { ActivityItem, EventType, shortAddr } from "@/lib/amm";

interface ActivityConfig {
  cls: string;
  sym: string;
  label: string;
  labelShort: string;
}

const ACTIVITY_MAP: Record<EventType, ActivityConfig> = {
  EthToTokenSwap:    { cls: "se", sym: "→", label: "ETH → BAL",       labelShort: "ETH→BAL"   },
  TokenToEthSwap:    { cls: "st", sym: "←", label: "BAL → ETH",       labelShort: "BAL→ETH"   },
  LiquidityProvided: { cls: "la", sym: "+", label: "Add Liquidity",    labelShort: "Add Liq."  },
  LiquidityRemoved:  { cls: "lr", sym: "−", label: "Remove Liquidity", labelShort: "Rem. Liq." },
};

interface ActivityFeedProps {
  items: ActivityItem[];
  compact?: boolean;
  suffix?: string;
}

export default function ActivityFeed({ items, compact = false, suffix = "" }: ActivityFeedProps) {
  return (
    <>
      {items.map((item) => {
        const m = ACTIVITY_MAP[item.type];
        const iconSize = compact ? { width: "30px", height: "30px", fontSize: "12px", borderRadius: "8px" } : {};
        return (
          <div key={item.id} className="ai">
            <div className={`aicon ${m.cls}`} style={iconSize}>{m.sym}</div>
            <div className="ab">
              <div className="at" style={compact ? { fontSize: "11px" } : {}}>
                {compact ? m.labelShort : m.label}
              </div>
              <div className="am">
                {compact ? item.a : `${shortAddr(item.addr)} · ${item.a} → ${item.b}`}
              </div>
            </div>
            <div className="atm">{item.time}{suffix}</div>
          </div>
        );
      })}
    </>
  );
}
