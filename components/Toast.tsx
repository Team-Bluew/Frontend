"use client";

export type ToastType = "ok" | "er" | "wn";

export interface ToastData {
  type: ToastType;
  msg: string;
}

interface ToastProps {
  toast: ToastData | null;
}

const ICON: Record<ToastType, string> = { ok: "✓", er: "✕", wn: "⚠" };

export default function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type}`}>
      <span>{ICON[toast.type]}</span>
      <span>{toast.msg}</span>
    </div>
  );
}
