"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Copy,
  CheckCircle,
  Loader2,
  AlertCircle,
  Info,
  User,
} from "lucide-react";

type Tab = "deposit" | "withdraw";
type Currency = "TRY" | "USDT";

interface BankAccount {
  id: string;
  bankName: string;
  iban: string;
  accountHolder: string;
  swiftCode?: string | null;
}

type WalletForm = {
  amount: string;
  currency: Currency;
  note: string;
  selectedBankId: string;
};

function formatIban(raw: string): string {
  return raw.replace(/(.{4})/g, "$1 ").trim();
}

async function fetchBankAccounts(): Promise<BankAccount[]> {
  const res = await fetch("/api/bank-accounts");
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Hesaplar yüklenemedi");
  return data.data;
}

async function submitWalletRequest(tab: Tab, form: WalletForm) {
  const endpoint = tab === "deposit" ? "/api/panel/cuzdan/deposit" : "/api/panel/cuzdan/withdraw";
  const metadata: Record<string, string> = {};
  if (form.note) metadata.note = form.note;
  if (tab === "deposit" && form.selectedBankId) metadata.bankAccountId = form.selectedBankId;

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
  const { data: session } = useSession();
  const userName = session?.user?.name ?? session?.user?.email ?? "—";
  const [tab, setTab] = useState<Tab>("deposit");
  const [form, setForm] = useState<WalletForm>({
    amount: "",
    currency: "TRY",
    note: "",
    selectedBankId: "",
  });
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  const {
    data: bankAccounts = [],
    isLoading: banksLoading,
    isError: banksError,
  } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: fetchBankAccounts,
    staleTime: 5 * 60 * 1000,
  });

  const selectedBank = bankAccounts.find((b) => b.id === form.selectedBankId) ?? null;

  const mutation = useMutation({
    mutationFn: (f: WalletForm) => submitWalletRequest(tab, f),
    onSuccess: () => {
      toast({
        title: tab === "deposit" ? "Yatırım talebi oluşturuldu" : "Çekim talebi oluşturuldu",
        description:
          tab === "deposit"
            ? "Havale/EFT/FAST işleminizi gerçekleştirdikten sonra admin onaylayacaktır."
            : "Çekim talebiniz inceleme için gönderildi.",
        variant: "success",
      });
      setForm({ amount: "", currency: "TRY", note: "", selectedBankId: "" });
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
    if (tab === "deposit" && !form.selectedBankId && bankAccounts.length > 0) {
      toast({ title: "Lütfen bir banka hesabı seçin", variant: "error" });
      return;
    }
    mutation.mutate(form);
  }

  async function copyIban(iban: string) {
    try {
      await navigator.clipboard.writeText(iban);
      setCopiedIban(iban);
      setTimeout(() => setCopiedIban(null), 2000);
      toast({ title: "IBAN kopyalandı", variant: "success" });
    } catch {
      toast({ title: "Kopyalama başarısız", variant: "error" });
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Cüzdan</h1>
        <p className="text-text-muted text-sm">Yatırım ve çekim işlemlerinizi buradan yapabilirsiniz.</p>
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

      {/* Bank Accounts Section — deposit only */}
      {tab === "deposit" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand" />
              Banka Hesaplarımız
            </CardTitle>
            <p className="text-xs text-text-muted">
              Havale / EFT / FAST ile aşağıdaki hesaplardan birine gönderim yapabilirsiniz.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {banksLoading ? (
              <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Hesaplar yükleniyor...
              </div>
            ) : banksError ? (
              <div className="flex items-center gap-2 text-danger text-sm py-2">
                <AlertCircle className="h-4 w-4" />
                Hesaplar yüklenemedi. Lütfen sayfayı yenileyin.
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="rounded-xl border border-border bg-bg-elevated px-4 py-4 text-sm text-text-muted flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0" />
                Şu anda aktif banka hesabı bulunmamaktadır. Lütfen daha sonra tekrar deneyin.
              </div>
            ) : (
              <div className="space-y-2">
                {bankAccounts.map((account) => {
                  const isSelected = form.selectedBankId === account.id;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, selectedBankId: account.id }))}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${
                        isSelected
                          ? "border-brand/50 bg-brand/5 ring-1 ring-brand/20"
                          : "border-border bg-bg-elevated hover:border-brand/30 hover:bg-brand/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                              isSelected
                                ? "border-brand/30 bg-brand/10"
                                : "border-border bg-bg-surface"
                            }`}
                          >
                            <Building2
                              className={`h-4 w-4 ${isSelected ? "text-brand" : "text-text-muted"}`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-text-primary text-sm">{account.bankName}</p>
                            <p className="text-xs text-text-muted truncate">{account.accountHolder}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-text-secondary tracking-wide">
                          {formatIban(account.iban)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyIban(account.iban);
                          }}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted hover:text-brand hover:bg-brand/10 transition-colors"
                        >
                          {copiedIban === account.iban ? (
                            <CheckCircle className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copiedIban === account.iban ? "Kopyalandı" : "Kopyala"}
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Instructions */}
            {bankAccounts.length > 0 && (
              <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-xs text-text-secondary space-y-2">
                <p className="font-medium text-brand flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  Havale/EFT/FAST Talimatları
                </p>

                {/* Highlighted username box */}
                <div className="rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-brand shrink-0" />
                  <div className="min-w-0">
                    <p className="text-brand font-semibold text-[11px] uppercase tracking-wide leading-none mb-0.5">
                      Transfer Açıklamasına Yazacağınız Ad
                    </p>
                    <p className="font-bold text-text-primary text-sm leading-tight">{userName}</p>
                  </div>
                </div>

                <ul className="space-y-0.5 pl-4 list-disc">
                  <li>Seçtiğiniz hesaba yatırmak istediğiniz tutarı gönderin.</li>
                  <li>Transfer açıklamasına yukarıdaki adı yazın (eşleştirme için zorunludur).</li>
                  <li>Aşağıdaki formda aynı tutarı girerek talebi gönderin.</li>
                  <li>Admin onayının ardından bakiyeniz güncellenir.</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

            {/* Show selected bank summary in deposit mode */}
            {tab === "deposit" && selectedBank && (
              <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm">
                <p className="text-xs font-medium text-success mb-1">Seçilen Hesap</p>
                <p className="text-text-primary font-medium">{selectedBank.bankName}</p>
                <p className="text-text-secondary text-xs">{selectedBank.accountHolder}</p>
                <p className="font-mono text-xs text-text-muted mt-1">{formatIban(selectedBank.iban)}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="note">Not (isteğe bağlı)</Label>
              <Input
                id="note"
                placeholder={
                  tab === "deposit" ? "Dekont numarası veya açıklama..." : "İşlem açıklaması..."
                }
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
        İşlem durumunu{" "}
        <a href="/panel/islemler" className="text-brand hover:underline">
          İşlemler
        </a>{" "}
        sayfasından takip edebilirsiniz.
      </p>
    </div>
  );
}
