import { z } from "zod";

export const depositSchema = z.object({
  amount: z
    .number()
    .positive("Miktar pozitif olmalıdır")
    .min(10, "Minimum yatırım miktarı 10'dur")
    .max(1_000_000, "Maksimum yatırım miktarı 1.000.000'dur"),
  currency: z.enum(["TRY", "USDT"], { error: "Geçersiz para birimi" }),
  note: z.string().max(200).optional(),
});

export const withdrawSchema = z.object({
  amount: z
    .number()
    .positive("Miktar pozitif olmalıdır")
    .min(10, "Minimum çekim miktarı 10'dur")
    .max(1_000_000, "Maksimum çekim miktarı 1.000.000'dur"),
  currency: z.enum(["TRY", "USDT"], { error: "Geçersiz para birimi" }),
  note: z.string().max(200).optional(),
});

export const adminBalanceSchema = z.object({
  userId: z.string().min(1, "Kullanıcı ID gereklidir"),
  amount: z
    .number()
    .positive("Miktar pozitif olmalıdır")
    .max(10_000_000, "Maksimum işlem miktarı aşıldı"),
  type: z.enum(["ADD", "SUBTRACT"], { error: "Geçersiz işlem türü" }),
  currency: z.enum(["TRY", "USDT"], { error: "Geçersiz para birimi" }),
  reason: z.string().min(5, "Gerekçe en az 5 karakter olmalıdır").max(500),
  adminPassword: z.string().min(1, "Admin şifresi gereklidir"),
});

export const updateTransactionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], { error: "Geçersiz durum" }),
  reason: z.string().max(500).optional(),
});

export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type AdminBalanceInput = z.infer<typeof adminBalanceSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
