import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withdrawSchema } from "@/lib/validations/ledger";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

async function getApprovedBalance(userId: string, currency: string): Promise<number> {
  const result = await prisma.ledgerEntry.aggregate({
    where: { userId, status: "APPROVED", currency: currency as "TRY" | "USDT" },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`withdraw:${session.user.id}:${ip}`, 3, 60_000);
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

  const parsed = withdrawSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      errors[key] = [...(errors[key] ?? []), issue.message];
    }
    return NextResponse.json({ success: false, error: "Doğrulama hatası.", details: errors }, { status: 422 });
  }

  const { amount, currency, note } = parsed.data;
  const balance = await getApprovedBalance(session.user.id, currency);

  if (amount > balance) {
    return NextResponse.json(
      { success: false, error: `Yetersiz bakiye. Mevcut bakiye: ${balance.toFixed(2)} ${currency}` },
      { status: 422 }
    );
  }

  // Withdrawal is stored as a negative amount
  const entry = await prisma.ledgerEntry.create({
    data: {
      userId: session.user.id,
      type: "WITHDRAWAL",
      amount: -amount,
      currency,
      status: "PENDING",
      metadata: note ? { note } : undefined,
    },
  });

  return NextResponse.json({
    success: true,
    data: { id: entry.id, amount: entry.amount.toString(), currency: entry.currency, status: entry.status },
  });
}
