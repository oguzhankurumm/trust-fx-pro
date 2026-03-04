import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Oturum açılmamış." }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const [trades, total] = await Promise.all([
    prisma.cryptoTrade.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.cryptoTrade.count({ where: { userId } }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      trades: trades.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        direction: t.direction,
        entryPrice: Number(t.entryPrice),
        exitPrice: t.exitPrice ? Number(t.exitPrice) : null,
        betAmount: Number(t.betAmount),
        payout: t.payout ? Number(t.payout) : null,
        duration: t.duration,
        result: t.result,
        resolvedAt: t.resolvedAt,
        createdAt: t.createdAt,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
    },
  });
}
