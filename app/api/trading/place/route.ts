import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Commission formula: 7.8 + duration * 0.1  (e.g. 10s → 8.8%, 40s → 11.8%)
// Win payout multiplier = 2 - commission%  (i.e. user gets back 2x bet minus commission)
function winMultiplier(duration: number): number {
  const commissionPct = 7.8 + duration * 0.1;
  return 2 - commissionPct / 100;
}

const PlaceSchema = z.object({
  symbol: z.enum(["BTC", "ETH", "BNB", "LTC", "DOT", "AVAX", "NEAR", "SOL", "XRP", "ADA"]),
  direction: z.enum(["UP", "DOWN"]),
  entryPrice: z.number().positive(),
  betAmount: z.number().min(10, "Minimum bahis 10 TRY."),
  duration: z.number().int().min(10).max(40),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Oturum açılmamış." }, { status: 401 });
  }

  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const parsed = PlaceSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Geçersiz veri.";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  const { symbol, direction, entryPrice, betAmount, duration } = parsed.data;

  // Check balance
  const balanceResult = await prisma.ledgerEntry.aggregate({
    where: { userId, status: "APPROVED", currency: "TRY" },
    _sum: { amount: true },
  });
  const balance = Number(balanceResult._sum.amount ?? 0);

  if (balance < betAmount) {
    return NextResponse.json(
      { success: false, error: "Yetersiz bakiye. Lütfen hesabınıza para yükleyin." },
      { status: 400 }
    );
  }

  // Create trade + deduct balance atomically
  const [trade] = await prisma.$transaction([
    prisma.cryptoTrade.create({
      data: {
        userId,
        symbol,
        direction,
        entryPrice,
        betAmount,
        duration,
        result: "PENDING",
      },
    }),
    prisma.ledgerEntry.create({
      data: {
        userId,
        type: "TRADE",
        amount: -betAmount,
        currency: "TRY",
        status: "APPROVED",
        metadata: { action: "BET_DEDUCTION", symbol, direction, duration },
      },
    }),
  ]);

  const multiplier = winMultiplier(duration);
  const potentialPayout = betAmount * multiplier;

  return NextResponse.json({
    success: true,
    data: {
      tradeId: trade.id,
      potentialPayout,
      newBalance: balance - betAmount,
    },
  });
}
