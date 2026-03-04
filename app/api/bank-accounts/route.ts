import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }

  const accounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      bankName: true,
      iban: true,
      accountHolder: true,
      swiftCode: true,
    },
  });

  return NextResponse.json({ success: true, data: accounts });
}
