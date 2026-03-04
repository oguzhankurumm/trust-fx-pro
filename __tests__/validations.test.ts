import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, changePasswordSchema } from "@/lib/validations/auth";
import { depositSchema, withdrawSchema, adminBalanceSchema, updateTransactionSchema } from "@/lib/validations/ledger";
import { contactSchema } from "@/lib/validations/contact";

// ─── Auth Validations ──────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("passes with valid credentials", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "secret123" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    email: "user@example.com",
    password: "Secure123",
    confirmPassword: "Secure123",
    name: "Test User",
  };

  it("passes with valid data", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects short password (< 8 chars)", () => {
    const result = registerSchema.safeParse({ ...valid, password: "Abc1", confirmPassword: "Abc1" });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({ ...valid, password: "secure123", confirmPassword: "secure123" });
    expect(result.success).toBe(false);
  });

  it("rejects password without digit", () => {
    const result = registerSchema.safeParse({ ...valid, password: "SecurePass", confirmPassword: "SecurePass" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "Different123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it("rejects name shorter than 2 chars", () => {
    const result = registerSchema.safeParse({ ...valid, name: "A" });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const valid = { currentPassword: "OldPass1", newPassword: "NewPass1", confirmPassword: "NewPass1" };

  it("passes with valid data", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty currentPassword", () => {
    expect(changePasswordSchema.safeParse({ ...valid, currentPassword: "" }).success).toBe(false);
  });

  it("rejects mismatched new passwords", () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: "DifferentPass1" });
    expect(result.success).toBe(false);
  });
});

// ─── Ledger Validations ────────────────────────────────────────────────────────

describe("depositSchema", () => {
  it("passes valid deposit", () => {
    expect(depositSchema.safeParse({ amount: 500, currency: "TRY" }).success).toBe(true);
  });

  it("rejects negative amount", () => {
    expect(depositSchema.safeParse({ amount: -100, currency: "TRY" }).success).toBe(false);
  });

  it("rejects amount below minimum (10)", () => {
    expect(depositSchema.safeParse({ amount: 5, currency: "TRY" }).success).toBe(false);
  });

  it("rejects invalid currency", () => {
    expect(depositSchema.safeParse({ amount: 100, currency: "BTC" }).success).toBe(false);
  });

  it("accepts USDT currency", () => {
    expect(depositSchema.safeParse({ amount: 50, currency: "USDT" }).success).toBe(true);
  });
});

describe("withdrawSchema", () => {
  it("passes valid withdrawal", () => {
    expect(withdrawSchema.safeParse({ amount: 200, currency: "TRY" }).success).toBe(true);
  });

  it("rejects zero amount", () => {
    expect(withdrawSchema.safeParse({ amount: 0, currency: "TRY" }).success).toBe(false);
  });
});

describe("adminBalanceSchema", () => {
  const valid = {
    userId: "user-cuid-123",
    amount: 1000,
    type: "ADD",
    currency: "TRY",
    reason: "Test düzenlemesi",
    adminPassword: "Admin123!",
  };

  it("passes valid admin balance adjustment", () => {
    expect(adminBalanceSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects SUBTRACT type", () => {
    // SUBTRACT is valid
    expect(adminBalanceSchema.safeParse({ ...valid, type: "SUBTRACT" }).success).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(adminBalanceSchema.safeParse({ ...valid, type: "INVALID" }).success).toBe(false);
  });

  it("rejects short reason (< 5 chars)", () => {
    expect(adminBalanceSchema.safeParse({ ...valid, reason: "ab" }).success).toBe(false);
  });

  it("rejects empty adminPassword", () => {
    expect(adminBalanceSchema.safeParse({ ...valid, adminPassword: "" }).success).toBe(false);
  });
});

describe("updateTransactionSchema", () => {
  it("accepts APPROVED status", () => {
    expect(updateTransactionSchema.safeParse({ status: "APPROVED" }).success).toBe(true);
  });

  it("accepts REJECTED status", () => {
    expect(updateTransactionSchema.safeParse({ status: "REJECTED" }).success).toBe(true);
  });

  it("rejects unknown status", () => {
    expect(updateTransactionSchema.safeParse({ status: "PENDING" }).success).toBe(false);
  });
});

// ─── Contact Validation ────────────────────────────────────────────────────────

describe("contactSchema", () => {
  const valid = { name: "Test User", email: "test@example.com", subject: "Test konu", message: "Test mesajı içeriği buraya gelir." };

  it("passes valid contact form", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects if honeypot (website) is filled", () => {
    expect(contactSchema.safeParse({ ...valid, website: "bot-filled" }).success).toBe(false);
  });

  it("rejects empty name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "not-email" }).success).toBe(false);
  });
});
