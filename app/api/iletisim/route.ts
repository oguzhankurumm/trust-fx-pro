import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`contact:${ip}`, 3, 300_000); // 3 per 5 minutes
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Çok fazla mesaj gönderdiniz. Lütfen 5 dakika bekleyin." },
      { status: 429 }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      errors[key] = [...(errors[key] ?? []), issue.message];
    }
    return NextResponse.json({ success: false, error: "Doğrulama hatası.", details: errors }, { status: 422 });
  }

  // Honeypot check — website field must be empty
  if (parsed.data.website) {
    // Silently succeed to confuse bots
    return NextResponse.json({ success: true, data: { message: "Mesajınız alındı." } });
  }

  const { name, email, subject, message } = parsed.data;

  // In production: send email via Resend/SendGrid here
  // For now, log to console and return success
  console.log("[İletişim]", { name, email, subject, message: message.slice(0, 100) });

  return NextResponse.json({
    success: true,
    data: { message: "Mesajınız başarıyla alındı. En kısa sürede yanıt vereceğiz." },
  });
}
