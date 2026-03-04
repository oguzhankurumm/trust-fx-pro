"use client";

import React, { useState } from "react";

interface CoinIconProps {
  /** CoinGecko image URL (used as secondary source if local icon missing) */
  src?: string;
  /** Coin symbol (e.g. "BTC") or name — used to find local icon and for fallback avatar */
  symbol: string;
  alt?: string;
  size?: number;
  className?: string;
}

const SYMBOL_COLORS = [
  "bg-orange-500", "bg-blue-500", "bg-purple-500", "bg-green-500",
  "bg-yellow-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
  "bg-red-500", "bg-cyan-500",
];

function colorForSymbol(symbol: string) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SYMBOL_COLORS[Math.abs(hash) % SYMBOL_COLORS.length];
}

/** Maps uppercase symbol → local static file extension */
const LOCAL_ICONS: Record<string, string> = {
  BTC:  "/crypto-icons/btc.svg",
  ETH:  "/crypto-icons/eth.svg",
  BNB:  "/crypto-icons/bnb.svg",
  DOT:  "/crypto-icons/dot.svg",
  AVAX: "/crypto-icons/avax.svg",
  LTC:  "/crypto-icons/ltc.svg",
  NEAR: "/crypto-icons/near.jpg",
  SOL:  "/crypto-icons/sol.svg",
  XRP:  "/crypto-icons/xrp.svg",
  ADA:  "/crypto-icons/ada.svg",
};

/**
 * Coin icon with a three-level fallback chain:
 * 1. Local static file from /public/crypto-icons/ (fastest, no external request)
 * 2. CoinGecko CDN URL passed via `src` prop
 * 3. Coloured letter avatar
 */
export function CoinIcon({ src, symbol, alt, size = 28, className = "" }: CoinIconProps) {
  const upperSymbol = symbol.toUpperCase();
  const localPath = LOCAL_ICONS[upperSymbol] ?? null;
  const label = alt ?? symbol;
  const letter = upperSymbol.charAt(0);
  const color = colorForSymbol(upperSymbol);

  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [secondaryFailed, setSecondaryFailed] = useState(false);

  const imgClass = `rounded-full shrink-0 object-contain ${className}`;

  if (localPath && !primaryFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={localPath}
        alt={label}
        width={size}
        height={size}
        className={imgClass}
        onError={() => setPrimaryFailed(true)}
        loading="lazy"
      />
    );
  }

  if (src && !secondaryFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label}
        width={size}
        height={size}
        className={imgClass}
        onError={() => setSecondaryFailed(true)}
        loading="lazy"
      />
    );
  }

  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${color} ${className}`}
      aria-label={label}
    >
      {letter}
    </span>
  );
}
