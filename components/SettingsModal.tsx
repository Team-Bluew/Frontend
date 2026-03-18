"use client";

interface SettingsModalProps {
  slip: number;
  setSlip: (v: number) => void;
  ddl: number;
  setDdl: (v: number) => void;
  onClose: () => void;
}

const SLIP_PRESETS = [0.1, 0.5, 1.0, 3.0];

export default function SettingsModal({ slip, setSlip, ddl, setDdl, onClose }: SettingsModalProps) {
  return (
    <div className="mover" onClick={onClose}>
      <div className="mcard" onClick={(e) => e.stopPropagation()}>
        <button className="xb" onClick={onClose}>×</button>
        <div className="mt">⚙ Settings</div>

        <label className="fl">Slippage Tolerance</label>
        <div className="sp">
          {SLIP_PRESETS.map((p) => (
            <button
              key={p}
              className={`sp-b ${slip === p ? "on" : ""}`}
              onClick={() => setSlip(p)}
            >
              {p}%
            </button>
          ))}
        </div>
        <div className="ni" style={{ marginBottom: "20px" }}>
          <input
            type="number"
            value={slip}
            min="0.01"
            max="50"
            step="0.1"
            onChange={(e) => setSlip(parseFloat(e.target.value) || 0.5)}
          />
          <span className="nu">%</span>
        </div>

        <label className="fl">Transaction Deadline</label>
        <div className="ni">
          <input
            type="number"
            value={ddl}
            min="1"
            max="4320"
            onChange={(e) => setDdl(parseInt(e.target.value) || 20)}
          />
          <span className="nu">minutes</span>
        </div>

        <button className="cta pr" style={{ marginTop: "22px" }} onClick={onClose}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
