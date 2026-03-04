"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";

export default function KayitPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", referralCode: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const newErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(data.details)) {
            newErrors[key] = (msgs as string[])[0];
          }
          setErrors(newErrors);
        } else {
          setErrors({ _global: data.error ?? "Kayıt başarısız." });
        }
        return;
      }

      // Auto-login after register
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      toast({ title: "Hesap oluşturuldu!", description: "Panele yönlendiriliyorsunuz.", variant: "success" });
      router.push("/panel");
    } catch {
      setErrors({ _global: "Bir hata oluştu. Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">Hesap Oluşturun</h1>
          <p className="text-sm text-text-muted mt-2">
            Zaten hesabınız var mı?{"\ "}
            <Link href="/giris" className="text-brand hover:underline font-medium">Giriş yapın</Link>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-bg-surface p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input id="name" placeholder="Adınız Soyadınız" value={form.name}
                onChange={(e) => update("name", e.target.value)} error={errors.name}
                disabled={loading} autoComplete="name" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" placeholder="ornek@email.com" value={form.email}
                onChange={(e) => update("email", e.target.value)} error={errors.email}
                disabled={loading} autoComplete="email" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon Numarası</Label>
              <Input id="phone" type="tel" placeholder="05XX XXX XX XX" value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                disabled={loading} autoComplete="tel" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password">Şifre</Label>
                <div className="relative">
                  <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••"
                    value={form.password} onChange={(e) => update("password", e.target.value)}
                    error={errors.password} disabled={loading} className="pr-10" autoComplete="new-password" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                    onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••"
                  value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)}
                  error={errors.confirmPassword} disabled={loading} autoComplete="new-password" />
              </div>
            </div>
            <p className="text-xs text-text-muted">Şifreniz 6 karakterden uzun olmalıdır.</p>

            <div className="space-y-1.5">
              <Label htmlFor="referralCode">Referans Kodu (İsteğe Bağlı)</Label>
              <Input id="referralCode" placeholder="Referans Kodu" value={form.referralCode}
                onChange={(e) => update("referralCode", e.target.value)} disabled={loading} />
            </div>

            {errors._global && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {errors._global}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full bg-brand hover:bg-brand-dim" loading={loading}>
              Kayıt Ol
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-text-muted">
            Kayıt olarak{"\ "}
            <Link href="/sartlar" className="text-brand hover:underline">Kullanım Koşulları</Link>
            {"\ ve\ "}
            <Link href="/gizlilik" className="text-brand hover:underline">Gizlilik Politikası</Link>
            {'\u2019nı kabul etmiş olursunuz.'}
          </p>
        </div>
      </div>
    </div>
  );
}
