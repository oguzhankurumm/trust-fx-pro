"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { contactSchema } from "@/lib/validations/contact";
import { Mail, MessageSquare, MapPin, Clock, Headphones } from "lucide-react";

export default function IletisimPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", website: "" });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const copy = { ...e }; delete copy[field]; return copy; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errs[issue.path[0] as string] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/iletisim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setErrors({ message: data.error ?? "Bir hata oluştu." });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-4">
            İletişime <span className="text-brand">Geçin</span>
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Sorularınız, önerileriniz veya destek talepleriniz için 7/24 yanınızdayız.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left — Contact Info */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-bg-surface p-7">
              <h2 className="text-xl font-bold text-text-primary mb-6">İletişim Bilgileri</h2>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">E-posta</p>
                    <p className="text-text-primary font-medium">destek@trustfxpro.com.tr</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">Canlı Destek</p>
                    <p className="text-text-primary font-medium">7/24 Canlı Chat</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">Adres</p>
                    <p className="text-text-primary font-medium">İstanbul, Türkiye</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-bg-surface p-7">
              <h2 className="text-xl font-bold text-text-primary mb-5">Çalışma Saatleri</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-brand shrink-0" />
                  <div className="flex justify-between w-full">
                    <span className="text-text-secondary text-sm">Pazartesi — Cuma</span>
                    <span className="text-text-primary text-sm font-medium">09:00 — 18:00</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-text-muted shrink-0" />
                  <div className="flex justify-between w-full">
                    <span className="text-text-secondary text-sm">Cumartesi</span>
                    <span className="text-text-muted text-sm">Kapalı</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-text-muted shrink-0" />
                  <div className="flex justify-between w-full">
                    <span className="text-text-secondary text-sm">Pazar</span>
                    <span className="text-text-muted text-sm">Kapalı</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-brand/30 bg-brand/5 p-6 flex items-start gap-4">
              <Headphones className="h-6 w-6 text-brand shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-primary mb-1">7/24 Teknik Destek</p>
                <p className="text-text-secondary text-sm">
                  Acil durumlarda teknik destek ekibimize 7 gün 24 saat ulaşabilirsiniz.
                </p>
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="rounded-2xl border border-border bg-bg-surface p-7">
            {success ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-5">
                  <span className="text-3xl">✓</span>
                </div>
                <p className="text-text-primary font-bold text-xl mb-2">Mesajınız Alındı!</p>
                <p className="text-text-muted text-sm">En kısa sürede size geri döneceğiz.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-text-primary mb-6">Mesaj Gönder</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* honeypot */}
                  <input type="text" name="website" value={form.website} onChange={(e) => set("website", e.target.value)} className="hidden" tabIndex={-1} aria-hidden="true" />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Ad Soyad</Label>
                      <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Adınız Soyadınız" />
                      {errors.name && <p className="text-danger text-xs">{errors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">E-posta</Label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ornek@email.com" />
                      {errors.email && <p className="text-danger text-xs">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Konu</Label>
                    <Input id="subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Mesajınızın konusu" />
                    {errors.subject && <p className="text-danger text-xs">{errors.subject}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message">Mesaj</Label>
                    <textarea
                      id="message"
                      rows={6}
                      value={form.message}
                      onChange={(e) => set("message", e.target.value)}
                      placeholder="Mesajınızı buraya yazın..."
                      className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
                    />
                    {errors.message && <p className="text-danger text-xs">{errors.message}</p>}
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dim text-white">
                    {loading ? "Gönderiliyor..." : "Mesaj Gönder"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
