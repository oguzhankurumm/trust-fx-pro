"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

async function updateName(name: string) {
  const res = await fetch("/api/panel/profil", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Bir hata oluştu.");
  return data;
}

async function changePassword(form: { currentPassword: string; newPassword: string; confirmPassword: string }) {
  const res = await fetch("/api/panel/profil", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Bir hata oluştu.");
  return data;
}

export default function ProfilPage() {
  const { data: session, update } = useSession();

  const [name, setName] = useState(session?.user?.name ?? "");

  const nameMutation = useMutation({
    mutationFn: updateName,
    onSuccess: async () => { await update({ name }); },
  });

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const pwMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" }),
  });

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    nameMutation.mutate(name);
  }

  function handlePwSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      pwMutation.reset();
      return;
    }
    pwMutation.mutate(pwForm);
  }

  const pwMismatch = pwForm.newPassword && pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Profil Ayarları</h1>
        <p className="text-text-muted text-sm">Hesap bilgilerinizi güncelleyin.</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader><CardTitle>Hesap Bilgileri</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>E-posta</Label>
            <p className="px-4 py-2.5 rounded-xl bg-bg-elevated border border-border text-text-secondary text-sm">
              {session?.user?.email ?? "—"}
            </p>
            <p className="text-xs text-text-muted">E-posta adresi değiştirilemez.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <p className="px-4 py-2.5 rounded-xl bg-bg-elevated border border-border text-text-secondary text-sm capitalize">
              {(session?.user as { role?: string })?.role?.toLowerCase() ?? "kullanıcı"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Name form */}
      <Card>
        <CardHeader><CardTitle>İsim Güncelle</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display-name">Görünen İsim</Label>
              <Input
                id="display-name"
                value={name}
                onChange={(e) => { setName(e.target.value); nameMutation.reset(); }}
                placeholder="Adınız Soyadınız"
              />
            </div>
            {nameMutation.isError && (
              <p className="text-xs text-danger">{(nameMutation.error as Error).message}</p>
            )}
            {nameMutation.isSuccess && (
              <p className="text-xs text-success">İsim güncellendi.</p>
            )}
            <Button type="submit" loading={nameMutation.isPending}>
              Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password form */}
      <Card>
        <CardHeader><CardTitle>Şifre Değiştir</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handlePwSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-pw">Mevcut Şifre</Label>
              <Input
                id="current-pw"
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => { setPwForm((f) => ({ ...f, currentPassword: e.target.value })); pwMutation.reset(); }}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">Yeni Şifre</Label>
              <Input
                id="new-pw"
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => { setPwForm((f) => ({ ...f, newPassword: e.target.value })); pwMutation.reset(); }}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">Yeni Şifre (Tekrar)</Label>
              <Input
                id="confirm-pw"
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => { setPwForm((f) => ({ ...f, confirmPassword: e.target.value })); pwMutation.reset(); }}
                placeholder="••••••••"
              />
            </div>
            {pwMismatch && (
              <p className="text-xs text-danger">Yeni şifreler eşleşmiyor.</p>
            )}
            {pwMutation.isError && (
              <p className="text-xs text-danger">{(pwMutation.error as Error).message}</p>
            )}
            {pwMutation.isSuccess && (
              <p className="text-xs text-success">Şifre başarıyla değiştirildi.</p>
            )}
            <Button type="submit" loading={pwMutation.isPending} disabled={!!pwMismatch}>
              Şifreyi Değiştir
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
