import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const updateNameSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır.").max(80),
});

// PATCH /api/panel/profil  — update display name
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`profil:name:${session.user.id}:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bir dakika bekleyin." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = updateNameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  return NextResponse.json({ ok: true });
}

// PUT /api/panel/profil  — change password
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`profil:pw:${session.user.id}:${ip}`, 5, 300_000); // 5 per 5 min
  if (!allowed) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen 5 dakika bekleyin." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Şifre değiştirme bu hesap için desteklenmiyor." }, { status: 400 });
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: hashed } });

  return NextResponse.json({ ok: true });
}
