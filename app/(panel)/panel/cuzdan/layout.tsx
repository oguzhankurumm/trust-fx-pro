import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cüzdan" };

export default function CuzdanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
