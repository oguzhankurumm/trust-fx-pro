"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { Plus, Pencil, Trash2, Building2, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface BankAccount {
  id: string;
  bankName: string;
  iban: string;
  accountHolder: string;
  swiftCode?: string | null;
  isActive: boolean;
  createdAt: string;
  admin?: { email: string; name?: string | null };
}

type FormData = {
  bankName: string;
  iban: string;
  accountHolder: string;
  swiftCode: string;
  isActive: boolean;
};

const emptyForm: FormData = {
  bankName: "",
  iban: "",
  accountHolder: "",
  swiftCode: "",
  isActive: true,
};

async function fetchAccounts(): Promise<BankAccount[]> {
  const res = await fetch("/api/admin/bank-accounts");
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Yükleme başarısız");
  return data.data;
}

async function createAccount(form: FormData): Promise<BankAccount> {
  const res = await fetch("/api/admin/bank-accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...form, swiftCode: form.swiftCode || undefined }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Oluşturma başarısız");
  return data.data;
}

async function updateAccount({ id, form }: { id: string; form: Partial<FormData> }): Promise<BankAccount> {
  const res = await fetch(`/api/admin/bank-accounts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...form, swiftCode: form.swiftCode || undefined }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Güncelleme başarısız");
  return data.data;
}

async function deleteAccount(id: string): Promise<void> {
  const res = await fetch(`/api/admin/bank-accounts/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Silme başarısız");
}

function formatIban(raw: string): string {
  const clean = raw.replace(/\s/g, "").toUpperCase();
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

export default function BankaHesaplariPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [ibanDisplay, setIbanDisplay] = useState("");

  const { data: accounts = [], isLoading, isError } = useQuery({
    queryKey: ["admin-bank-accounts"],
    queryFn: fetchAccounts,
  });

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bank-accounts"] });
      toast({ title: "Hesap eklendi", variant: "success" });
      closeModal();
    },
    onError: (err: Error) => toast({ title: "Hata", description: err.message, variant: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: updateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bank-accounts"] });
      toast({ title: "Hesap güncellendi", variant: "success" });
      closeModal();
    },
    onError: (err: Error) => toast({ title: "Hata", description: err.message, variant: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bank-accounts"] });
      toast({ title: "Hesap silindi", variant: "success" });
      setDeleteConfirm(null);
    },
    onError: (err: Error) => toast({ title: "Hata", description: err.message, variant: "error" }),
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setIbanDisplay("");
    setShowModal(true);
  }

  function openEdit(account: BankAccount) {
    setEditingId(account.id);
    setForm({
      bankName: account.bankName,
      iban: account.iban,
      accountHolder: account.accountHolder,
      swiftCode: account.swiftCode ?? "",
      isActive: account.isActive,
    });
    setIbanDisplay(formatIban(account.iban));
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setIbanDisplay("");
  }

  function handleIbanChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\s/g, "").toUpperCase();
    setForm((f) => ({ ...f, iban: raw }));
    setIbanDisplay(formatIban(raw));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Banka Hesapları</h1>
          <p className="text-text-muted text-sm mt-1">
            Kullanıcılara yatırım için gösterilecek havale/EFT/FAST hesapları.
          </p>
        </div>
        <Button onClick={openCreate} variant="brand" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Hesap Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand" />
            Kayıtlı Hesaplar ({accounts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-text-muted">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Yükleniyor...
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-12 text-danger gap-2">
              <AlertCircle className="h-4 w-4" />
              Hesaplar yüklenemedi.
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2">
              <Building2 className="h-8 w-8 opacity-30" />
              <p className="text-sm">Henüz banka hesabı eklenmemiş.</p>
              <Button onClick={openCreate} variant="outline" size="sm" className="mt-2 gap-2">
                <Plus className="h-4 w-4" />
                İlk Hesabı Ekle
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Banka Adı</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">IBAN</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Hesap Sahibi</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Durum</th>
                    <th className="px-4 py-3 text-right font-medium text-text-muted">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr
                      key={account.id}
                      className="border-b border-border last:border-0 hover:bg-bg-elevated transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-text-primary">{account.bankName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                        {formatIban(account.iban)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{account.accountHolder}</td>
                      <td className="px-4 py-3">
                        {account.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                            <CheckCircle className="h-3 w-3" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-text-muted/10 px-2 py-0.5 text-xs font-medium text-text-muted">
                            Pasif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(account)}
                            className="rounded-lg p-1.5 text-text-muted hover:text-brand hover:bg-brand/10 transition-colors"
                            title="Düzenle"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(account.id)}
                            className="rounded-lg p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold text-text-primary">
                {editingId ? "Hesabı Düzenle" : "Yeni Hesap Ekle"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bankName">Banka Adı *</Label>
                <Input
                  id="bankName"
                  placeholder="Örn: Ziraat Bankası"
                  value={form.bankName}
                  onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                  required
                  minLength={3}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="iban">IBAN *</Label>
                <Input
                  id="iban"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  value={ibanDisplay}
                  onChange={handleIbanChange}
                  required
                  disabled={isPending}
                  className="font-mono"
                />
                <p className="text-xs text-text-muted">TR ile başlayan 26 karakter</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="accountHolder">Hesap Sahibi *</Label>
                <Input
                  id="accountHolder"
                  placeholder="Ad Soyad / Şirket Adı"
                  value={form.accountHolder}
                  onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value }))}
                  required
                  minLength={3}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="swiftCode">SWIFT Kodu (isteğe bağlı)</Label>
                <Input
                  id="swiftCode"
                  placeholder="Örn: TCZBTR2A"
                  value={form.swiftCode}
                  onChange={(e) => setForm((f) => ({ ...f, swiftCode: e.target.value.toUpperCase() }))}
                  maxLength={11}
                  disabled={isPending}
                />
              </div>

              {editingId && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isActive}
                    onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      form.isActive ? "bg-success" : "bg-border"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        form.isActive ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <Label className="cursor-pointer" onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}>
                    {form.isActive ? "Aktif" : "Pasif"}
                  </Label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal} disabled={isPending}>
                  İptal
                </Button>
                <Button type="submit" variant="brand" className="flex-1" loading={isPending}>
                  {editingId ? "Kaydet" : "Ekle"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-surface shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                <Trash2 className="h-5 w-5 text-danger" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Hesabı Sil</h3>
                <p className="text-sm text-text-muted">Bu işlem geri alınamaz.</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary">
              Bu banka hesabını silmek istediğinizden emin misiniz? Kullanıcılar artık bu hesabı göremeyecek.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteMutation.isPending}
              >
                İptal
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirm)}
              >
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
