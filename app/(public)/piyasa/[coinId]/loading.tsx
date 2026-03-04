import React from "react";
import { ArrowLeft } from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-bg-elevated ${className}`} />
  );
}

export default function CoinDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Back link placeholder */}
      <div className="inline-flex items-center gap-1.5 text-sm text-text-muted mb-4">
        <ArrowLeft className="h-3.5 w-3.5" />
        Piyasaya Dön
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Coin header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="text-right space-y-1.5">
              <Skeleton className="h-8 w-36 ml-auto" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          </div>

          {/* Chart placeholder */}
          <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-[380px] w-full rounded-none" />
          </div>

          {/* Coin info */}
          <div className="rounded-xl border border-border bg-bg-surface p-5 space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="rounded-xl border border-border bg-bg-surface p-5 space-y-4 sticky top-20">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
            <div className="flex justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-28" />
              </div>
              <div className="space-y-1.5 items-end flex flex-col">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
