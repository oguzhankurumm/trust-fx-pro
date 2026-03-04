"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

type Tab = "deposit" | "withdraw";
type Currency = "TRY" | "USDT";

type WalletForm = { amount: string; currency: Currency; note: string };

async function submitWalletRequest(tab: Tab, form: WalletForm) {
  const endpoint = tab === "deposit" ? "/api/panel/cuzdan/deposit" : "/api/panel/cuzdan/withdraw";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: parseFloat(form.amount),
      currency: form.currency,
      note: form.note || undefined,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "İşlem başarısız");
  return data;
}

export default function CuzdanPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("deposit");
  const [form, setForm] = useState<WalletForm>({ amount: "", currency: "TRY", note: "" });

  const mutation = useMutation({
    mutationFn: (f: WalletForm) => submitWalletRequest(tab, f),
    onSuccess: () => {
      toast({
        title: tab === "deposit" ? "Yatırım talebi oluşturuldu" : "Çekim talebi oluşturuldu",
        description: "İşleminiz inceleme için gönderildi.",
        variant: "success",
      });
      setForm({ amount: "", currency: "TRY", note: "" });
    },
    onError: (err: Error) => {
      toast({ title: "İşlem başarısız", description: err.message, variant: "error" });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(form.amount);
    if (isNaN(num) || num <= 0) {
      toast({ title: "Geçersiz miktar", variant: "error" });
      return;
    }
    mutation.mutate(form);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Cüzdan</h1>
        <p className="text-text-muted text-sm">Yatırım ve çekim işlemlerinizi buradan yapabilirsiniz.</p>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        ⚠️ İşlemler admin onayına tabidir. Gerçek kripto transferi gerçekleşmez — bu simüle bir ledger sistemidir.
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setTab("deposit")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            tab === "deposit" ? "bg-success/10 text-success" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <ArrowDownCircle className="h-4 w-4" />
          Yatırım Yap
        </button>
        <button
          onClick={() => setTab("withdraw")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            tab === "withdraw" ? "bg-danger/10 text-danger" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <ArrowUpCircle className="h-4 w-4" />
          Para Çek
        </button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{tab === "deposit" ? "Yatırım Talebi" : "Çekim Talebi"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label>Para Birimi</Label>
              <div className="flex gap-2">
                {(["TRY", "USDT"] as Currency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, currency: c }))}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      form.currency === c
                        ? "bg-brand/10 border-brand/30 text-brand"
                        : "border-border text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {c === "TRY" ? "₺ TRY" : "$ USDT"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">
                Miktar ({form.currency}) — Minimum 10
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                min="10"
                step="0.01"
                required
                disabled={mutation.isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note">Not (isteğe bağlı)</Label>
              <Input
                id="note"
                placeholder="İşlem açıklaması..."
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                maxLength={200}
                disabled={mutation.isPending}
              />
            </div>

            <Button
              type="submit"
              variant={tab === "deposit" ? "success" : "danger"}
              size="lg"
              className="w-full"
              loading={mutation.isPending}
            >
              {tab === "deposit" ? "Yatırım Talebi Gönder" : "Çekim Talebi Gönder"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-text-muted">
        Talepler admin tarafından incelenerek onaylanır veya reddedilir.
        İşlem durumunu <a href="/panel/islemler" className="text-brand hover:underline">İşlemler</a> sayfasından takip edebilirsiniz.
      </p>
    </div>
  );
}
