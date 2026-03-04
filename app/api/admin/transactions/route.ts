import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const ip = getClientIp(req);
  const { allowed } = rateLimit(`admin:txlist:${session.user.id}:${ip}`, 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const type = searchParams.get("type") ?? "";       // DEPOSIT | WITHDRAWAL | ADJUSTMENT
  const status = searchParams.get("status") ?? "";   // PENDING | APPROVED | REJECTED | CANCELLED
  const currency = searchParams.get("currency") ?? ""; // TRY | USDT
  const q = searchParams.get("q") ?? "";             // search by user email/name

  const where: {
    type?: "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT";
    status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    currency?: "TRY" | "USDT";
    user?: {
      OR: Array<{ email?: { contains: string; mode: "insensitive" }; name?: { contains: string; mode: "insensitive" } }>;
    };
  } = {};

  if (type) where.type = type as "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT";
  if (status) where.status = status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  if (currency) where.currency = currency as "TRY" | "USDT";
  if (q) {
    where.user = {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const [entries, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        status: true,
        metadata: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.ledgerEntry.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      transactions: entries.map((e) => ({
        ...e,
        amount: e.amount.toString(),
        createdAt: e.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
    },
  });
}
