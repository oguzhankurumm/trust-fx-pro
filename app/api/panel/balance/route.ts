import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Oturum açılmamış." }, { status: 401 });
  }

  const userId = session.user.id;

  const result = await prisma.ledgerEntry.groupBy({
    by: ["currency"],
    where: { userId, status: "APPROVED" },
    _sum: { amount: true },
  });

  const balances: Record<string, number> = { TRY: 0, USDT: 0 };
  for (const row of result) {
    balances[row.currency] = Number(row._sum.amount ?? 0);
  }

  return NextResponse.json({ success: true, data: balances });
}
