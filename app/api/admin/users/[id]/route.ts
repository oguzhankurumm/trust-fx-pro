import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      ledgerEntries: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

  // Compute balance per currency
  const approved = await prisma.ledgerEntry.groupBy({
    by: ["currency"],
    where: { userId: id, status: "APPROVED" },
    _sum: { amount: true },
  });

  return NextResponse.json({ user, balances: approved });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  // Prevent admin from blocking themselves
  if (id === session.user.id) {
    return NextResponse.json({ error: "Kendi hesabınızı engelleyemezsiniz." }, { status: 400 });
  }

  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { status: parsed.data.status } }),
    prisma.adminAudit.create({
      data: {
        adminId: session.user.id,
        actionType: parsed.data.status === "BLOCKED" ? "BLOCK_USER" : "UNBLOCK_USER",
        targetUserId: id,
        payload: { status: parsed.data.status },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, status: user.status });
}
