"use client";

import React, { useState } from "react";

interface CoinIconProps {
  src: string;
  alt: string;
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

/**
 * Coin icon — loads directly from CoinGecko CDN (bypasses Next.js image
 * optimization which can cause all icons to look identical via Netlify's CDN).
 * Falls back to a coloured letter avatar on load error.
 */
export function CoinIcon({ src, alt, size = 28, className = "" }: CoinIconProps) {
  const [failed, setFailed] = useState(false);
  const letter = alt.charAt(0).toUpperCase();
  const color = colorForSymbol(alt);

  if (failed || !src) {
    return (
      <span
        style={{ width: size, height: size, fontSize: size * 0.45 }}
        className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${color} ${className}`}
        aria-label={alt}
      >
        {letter}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full shrink-0 ${className}`}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
