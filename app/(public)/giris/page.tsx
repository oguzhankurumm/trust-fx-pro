"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";

export default function GirisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/panel";
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("E-posta veya şifre hatalı. Lütfen tekrar deneyin.");
        toast({ title: "Giriş başarısız", description: "E-posta veya şifrenizi kontrol edin.", variant: "error" });
      } else {
        toast({ title: "Hoş geldiniz!", variant: "success" });
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">Hesabınıza Giriş Yapın</h1>
          <p className="text-sm text-text-muted mt-2">
            Hesabınız yok mu?{"\ "}
            <Link href="/kayit" className="text-brand hover:underline font-medium">
              Hemen kayıt olun
            </Link>
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-border bg-bg-surface p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Şifre</Label>
                <Link href="#" className="text-xs text-brand hover:underline">Şifremi Unuttum</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full bg-brand hover:bg-brand-dim" loading={loading}>
              Giriş Yap
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-text-muted">
            Giriş yaparak{"\ "}
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
