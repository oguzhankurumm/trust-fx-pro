import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Yetkisiz." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const result = searchParams.get("result") ?? "";
  const symbol = searchParams.get("symbol") ?? "";
  const q = searchParams.get("q") ?? "";
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = {};
  if (result && ["PENDING", "WIN", "LOSS"].includes(result)) where.result = result;
  if (symbol) where.symbol = symbol;
  if (q) {
    where.user = {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const [trades, total] = await Promise.all([
    prisma.cryptoTrade.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.cryptoTrade.count({ where }),
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
        user: t.user,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
    },
  });
}
