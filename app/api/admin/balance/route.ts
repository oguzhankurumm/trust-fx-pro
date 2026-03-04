import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminBalanceSchema } from "@/lib/validations/ledger";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 403 });
  }

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`admin:balance:${session.user.id}:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Çok fazla istek. Lütfen bir dakika bekleyin." },
      { status: 429 }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const parsed = adminBalanceSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      errors[key] = [...(errors[key] ?? []), issue.message];
    }
    return NextResponse.json({ success: false, error: "Doğrulama hatası.", details: errors }, { status: 422 });
  }

  const { userId, amount, type, currency, reason, adminPassword } = parsed.data;

  // Re-verify admin password
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!admin?.passwordHash) {
    return NextResponse.json({ success: false, error: "Admin şifre doğrulaması başarısız." }, { status: 403 });
  }

  const passwordValid = await bcrypt.compare(adminPassword, admin.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ success: false, error: "Admin şifre yanlış." }, { status: 403 });
  }

  // Verify target user exists
  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!targetUser) {
    return NextResponse.json({ success: false, error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const adjustedAmount = type === "ADD" ? amount : -amount;

  // Transactional: create ledger entry + audit log
  const [entry] = await prisma.$transaction([
    prisma.ledgerEntry.create({
      data: {
        userId,
        type: "ADJUSTMENT",
        amount: adjustedAmount,
        currency,
        status: "APPROVED",
        metadata: { adminId: session.user.id, reason, adjustType: type },
      },
    }),
    prisma.adminAudit.create({
      data: {
        adminId: session.user.id,
        actionType: "BALANCE_ADJUST",
        targetUserId: userId,
        payload: {
          amount: adjustedAmount.toString(),
          currency,
          type,
          reason,
          targetEmail: targetUser.email,
        },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { id: entry.id, amount: entry.amount.toString(), currency, status: "APPROVED" },
  });
}
