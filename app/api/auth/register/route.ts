import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`register:${ip}`, 5, 600_000); // 5 per 10 minutes
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Çok fazla kayıt denemesi. Lütfen 10 dakika bekleyin." },
      { status: 429 }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      errors[key] = [...(errors[key] ?? []), issue.message];
    }
    return NextResponse.json({ success: false, error: "Doğrulama hatası.", details: errors }, { status: 422 });
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Bu e-posta adresi zaten kayıtlı." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: "USER",
      status: "ACTIVE",
      profile: {
        create: { name },
      },
    },
    select: { id: true, email: true },
  });

  return NextResponse.json({ success: true, data: { id: user.id, email: user.email } }, { status: 201 });
}
