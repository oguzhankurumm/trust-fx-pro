import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır").max(100),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  subject: z.string().min(5, "Konu en az 5 karakter olmalıdır").max(150),
  message: z
    .string()
    .min(20, "Mesaj en az 20 karakter olmalıdır")
    .max(2000, "Mesaj en fazla 2000 karakter olabilir"),
  // honeypot — must be empty
  website: z.string().max(0, "Spam tespit edildi").optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
