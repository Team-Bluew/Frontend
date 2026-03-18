"use client";

import { useState, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import SwapCard      from "@/components/SwapCard";
import LiquidityCard from "@/components/LiquidityCard";
import PoolStats     from "@/components/PoolStats";
import Sidebar       from "@/components/Sidebar";
import SettingsModal from "@/components/SettingsModal";
import Toast, { ToastData } from "@/components/Toast";
import Footer from "@/components/Footer";
import { shortAddr } from "@/lib/amm";

type Tab = "swap" | "liquidity" | "pool";

export default function Home() {
  const [tab,   setTab]   = useState<Tab>("swap");
  const [slip,  setSlip]  = useState(0.5);
  const [ddl,   setDdl]   = useState(20);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const { address, isConnected } = useAccount();
  const { connect }    = useConnect();
  const { disconnect } = useDisconnect();

  function notify(type: ToastData["type"], msg: string) {
    setToast({ type, msg });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4000);
  }

  function handleWallet() {
    if (isConnected) disconnect();
    else connect({ connector: injected() });
  }

  return (
    <div className="root">
      <div className="z1">
        <header className="hdr">
          <div className="logo">⬡ NovaDEX</div>
          <nav className="nav">
            {(["swap", "liquidity", "pool"] as Tab[]).map((t) => (
              <button key={t} className={`nb ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </nav>
          <button className="wb" onClick={handleWallet}>
            <span className={`dot ${isConnected ? "on" : "off"}`} />
            {isConnected && address ? shortAddr(address) : "Connect Wallet"}
          </button>
        </header>

        <main className="main">
          <div>
            {tab === "swap"      && <SwapCard      slip={slip} ddl={ddl} onOpenSettings={() => setModal(true)} onNotify={notify} />}
            {tab === "liquidity" && <LiquidityCard ddl={ddl} onNotify={notify} />}
            {tab === "pool"      && <PoolStats />}
          </div>
          {tab !== "pool" && <div className="sidebar-col"><Sidebar /></div>}
        </main>
        <Footer />
      </div>

      {modal && <SettingsModal slip={slip} setSlip={setSlip} ddl={ddl} setDdl={setDdl} onClose={() => setModal(false)} />}
      <Toast toast={toast} />

      {/* Mobile bottom tab bar */}
      <nav className="mob-nav">
        <button className={tab === "swap" ? "on" : ""} onClick={() => setTab("swap")}>
          <svg viewBox="0 0 24 24"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
          Swap
        </button>
        <button className={tab === "liquidity" ? "on" : ""} onClick={() => setTab("liquidity")}>
          <svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="3"/></svg>
          Liquidity
        </button>
        <button className={tab === "pool" ? "on" : ""} onClick={() => setTab("pool")}>
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Pool
        </button>
      </nav>
    </div>
  );
}
