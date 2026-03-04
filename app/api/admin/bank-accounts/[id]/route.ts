import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBankAccountSchema } from "@/lib/validations/ledger";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 403 });
  }

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`admin:bank-accounts:update:${session.user.id}:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Çok fazla istek. Lütfen bir dakika bekleyin." },
      { status: 429 }
    );
  }

  const { id } = await ctx.params;

  const existing = await prisma.bankAccount.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Hesap bulunamadı." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const parsed = updateBankAccountSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      errors[key] = [...(errors[key] ?? []), issue.message];
    }
    return NextResponse.json({ success: false, error: "Doğrulama hatası.", details: errors }, { status: 422 });
  }

  const updateData = {
    ...parsed.data,
    swiftCode: parsed.data.swiftCode === "" ? null : parsed.data.swiftCode,
  };

  // If IBAN is being changed, check uniqueness
  if (updateData.iban && updateData.iban !== existing.iban) {
    const ibanTaken = await prisma.bankAccount.findUnique({ where: { iban: updateData.iban } });
    if (ibanTaken) {
      return NextResponse.json({ success: false, error: "Bu IBAN zaten kayıtlı." }, { status: 409 });
    }
  }

  const [updated] = await prisma.$transaction([
    prisma.bankAccount.update({ where: { id }, data: updateData }),
    prisma.adminAudit.create({
      data: {
        adminId: session.user.id,
        actionType: "BANK_ACCOUNT_UPDATE",
        payload: { id, changes: updateData },
      },
    }),
  ]);

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 403 });
  }

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`admin:bank-accounts:delete:${session.user.id}:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Çok fazla istek. Lütfen bir dakika bekleyin." },
      { status: 429 }
    );
  }

  const { id } = await ctx.params;

  const existing = await prisma.bankAccount.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Hesap bulunamadı." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.bankAccount.delete({ where: { id } }),
    prisma.adminAudit.create({
      data: {
        adminId: session.user.id,
        actionType: "BANK_ACCOUNT_DELETE",
        payload: { id, bankName: existing.bankName, iban: existing.iban },
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
