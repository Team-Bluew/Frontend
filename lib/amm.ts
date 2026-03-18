// ── AMM math ────────────────────────────────────────────────────────────────
export function ammOut(input: number, inputReserve: number, outputReserve: number): number {
  if (input <= 0 || inputReserve <= 0 || outputReserve <= 0) return 0;
  const inputWithFee = input * 997;
  return (inputWithFee * outputReserve) / (inputReserve * 1000 + inputWithFee);
}

export function priceImpact(amountIn: number, amountOut: number, spotOut: number): number {
  if (spotOut <= 0) return 0;
  return Math.min(99.99, Math.abs(((spotOut - amountOut) / spotOut) * 100));
}

// ── Formatters ───────────────────────────────────────────────────────────────
export function fmt(n: number | null | undefined, decimals = 4): string {
  if (n === null || n === undefined || isNaN(n)) return "–";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function shortAddr(addr: string): string {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export function deadline(minutes: number): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
}

// ── Activity feed types ───────────────────────────────────────────────────────
export type EventType = "EthToTokenSwap" | "TokenToEthSwap" | "LiquidityProvided" | "LiquidityRemoved";

export interface ActivityItem {
  id: number;
  type: EventType;
  addr: string;
  a: string;
  b: string;
  time: string;
}

// ── Error messages ────────────────────────────────────────────────────────────
export const CONTRACT_ERRORS: Record<string, string> = {
  DeadlineExpired:              "Transaction window expired, please retry.",
  SlippageExceeded:             "Price moved too much — increase slippage tolerance.",
  InsufficientLiquidity:        "Not enough liquidity in the pool.",
  TokenDepositExceedsMax:       "Token amount exceeds your set maximum.",
  EthTransferFailed:            "ETH transfer failed — check your balance.",
  TokenTransferFailed:          "Token transfer failed — check your allowance.",
  ZeroReserves:                 "Pool has no reserves yet.",
  DexAlreadyInitialized:        "Pool is already active.",
  ReentrancyGuardReentrantCall: "Please wait before retrying.",
  InvalidEthAmount:             "Invalid ETH amount entered.",
  InvalidTokenAmount:           "Invalid token amount entered.",
};

export function parseContractError(err: unknown): string {
  const msg = String(err);
  for (const [key, val] of Object.entries(CONTRACT_ERRORS)) {
    if (msg.includes(key)) return val;
  }
  if (msg.includes("User rejected")) return "Transaction rejected.";
  return "Transaction failed. Please try again.";
}
