import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trading" };

export default function TradingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
