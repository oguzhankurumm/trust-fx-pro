import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTransactionSchema } from "@/lib/validations/ledger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const parsed = updateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Doğrulama hatası." }, { status: 422 });
  }

  const { status, reason } = parsed.data;

  // Verify transaction exists and is PENDING
  const entry = await prisma.ledgerEntry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ success: false, error: "İşlem bulunamadı." }, { status: 404 });
  }
  if (entry.status !== "PENDING") {
    return NextResponse.json({ success: false, error: "Sadece beklemedeki işlemler güncellenebilir." }, { status: 422 });
  }

  const [updated] = await prisma.$transaction([
    prisma.ledgerEntry.update({
      where: { id },
      data: { status, metadata: { ...(entry.metadata as object ?? {}), adminReason: reason } },
    }),
    prisma.adminAudit.create({
      data: {
        adminId: session.user.id,
        actionType: status === "APPROVED" ? "APPROVE_TRANSACTION" : "REJECT_TRANSACTION",
        targetUserId: entry.userId,
        payload: { transactionId: id, status, reason: reason ?? null, type: entry.type },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { id: updated.id, status: updated.status },
  });
}
