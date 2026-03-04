import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const WIN_PROBABILITY = 0.47; // 47% win rate — house edge

// Commission formula: 7.8 + duration * 0.1  (e.g. 10s → 8.8%, 40s → 11.8%)
function winMultiplier(duration: number): number {
  const commissionPct = 7.8 + duration * 0.1;
  return 2 - commissionPct / 100;
}

const ResolveSchema = z.object({
  tradeId: z.string().min(1),
  exitPrice: z.number().positive(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Oturum açılmamış." }, { status: 401 });
  }

  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const parsed = ResolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Geçersiz veri." }, { status: 400 });
  }

  const { tradeId, exitPrice } = parsed.data;

  const trade = await prisma.cryptoTrade.findUnique({ where: { id: tradeId } });

  if (!trade) {
    return NextResponse.json({ success: false, error: "İşlem bulunamadı." }, { status: 404 });
  }

  if (trade.userId !== userId) {
    return NextResponse.json({ success: false, error: "Yetkisiz." }, { status: 403 });
  }

  if (trade.result !== "PENDING") {
    return NextResponse.json({ success: false, error: "Bu işlem zaten sonuçlandı." }, { status: 400 });
  }

  const isWin = Math.random() < WIN_PROBABILITY;
  const result = isWin ? "WIN" : "LOSS";
  const multiplier = winMultiplier(trade.duration);
  const payout = isWin ? Number(trade.betAmount) * multiplier : null;

  const updateTrade = prisma.cryptoTrade.update({
    where: { id: tradeId },
    data: {
      result,
      exitPrice,
      payout,
      resolvedAt: new Date(),
    },
  });

  if (isWin && payout) {
    await prisma.$transaction([
      updateTrade,
      prisma.ledgerEntry.create({
        data: {
          userId,
          type: "TRADE",
          amount: payout,
          currency: "TRY",
          status: "APPROVED",
          metadata: {
            action: "WIN_PAYOUT",
            tradeId,
            symbol: trade.symbol,
            direction: trade.direction,
            exitPrice,
            multiplier,
          },
        },
      }),
    ]);
  } else {
    await updateTrade;
  }

  return NextResponse.json({
    success: true,
    data: {
      result,
      payout,
      exitPrice,
    },
  });
}
