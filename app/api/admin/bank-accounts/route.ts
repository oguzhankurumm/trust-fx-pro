import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bankAccountSchema } from "@/lib/validations/ledger";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 403 });
  }

  const accounts = await prisma.bankAccount.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      bankName: true,
      iban: true,
      accountHolder: true,
      swiftCode: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      admin: { select: { email: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: accounts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 403 });
  }

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`admin:bank-accounts:create:${session.user.id}:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Çok fazla istek. Lütfen bir dakika bekleyin." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const parsed = bankAccountSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      errors[key] = [...(errors[key] ?? []), issue.message];
    }
    return NextResponse.json({ success: false, error: "Doğrulama hatası.", details: errors }, { status: 422 });
  }

  const { bankName, iban, accountHolder, swiftCode, isActive } = parsed.data;

  // Check IBAN uniqueness
  const existing = await prisma.bankAccount.findUnique({ where: { iban } });
  if (existing) {
    return NextResponse.json({ success: false, error: "Bu IBAN zaten kayıtlı." }, { status: 409 });
  }

  const [account] = await prisma.$transaction([
    prisma.bankAccount.create({
      data: {
        bankName,
        iban,
        accountHolder,
        swiftCode: swiftCode || null,
        isActive: isActive ?? true,
        adminId: session.user.id,
      },
    }),
    prisma.adminAudit.create({
      data: {
        adminId: session.user.id,
        actionType: "BANK_ACCOUNT_CREATE",
        payload: { bankName, iban, accountHolder, swiftCode: swiftCode || null },
      },
    }),
  ]);

  return NextResponse.json({ success: true, data: account }, { status: 201 });
}
