import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCompact,
  formatPercent,
  priceChangeColor,
  formatDate,
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats TRY correctly", () => {
    const result = formatCurrency(1234.56, "TRY");
    expect(result).toContain("1.234");
    expect(result).toContain("₺");
  });

  it("formats USDT correctly", () => {
    const result = formatCurrency(100, "USDT");
    expect(result).toContain("$");
  });

  it("handles zero", () => {
    const result = formatCurrency(0, "TRY");
    expect(result).toContain("0");
  });
});

describe("formatCompact", () => {
  it("formats millions with M suffix", () => {
    const result = formatCompact(1_500_000);
    expect(result).toMatch(/1[.,]5\s*[Mm]/);
  });

  it("formats thousands with K suffix", () => {
    const result = formatCompact(50_000);
    expect(result).toMatch(/50\s*[Bb]/); // Turkish locale uses B for bın
  });
});

describe("formatPercent", () => {
  it("adds + for positive values", () => {
    expect(formatPercent(5.5)).toBe("+5.50%");
  });

  it("shows - for negative values", () => {
    expect(formatPercent(-3.14)).toBe("-3.14%");
  });

  it("returns dash for null", () => {
    expect(formatPercent(null)).toBe("—");
  });

  it("returns dash for undefined", () => {
    expect(formatPercent(undefined)).toBe("—");
  });

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("+0.00%");
  });
});

describe("priceChangeColor", () => {
  it("returns success for positive", () => {
    expect(priceChangeColor(3.5)).toBe("text-success");
  });

  it("returns danger for negative", () => {
    expect(priceChangeColor(-2)).toBe("text-danger");
  });

  it("returns success for zero", () => {
    expect(priceChangeColor(0)).toBe("text-success");
  });

  it("returns secondary for null", () => {
    expect(priceChangeColor(null)).toBe("text-text-secondary");
  });
});

describe("formatDate", () => {
  it("formats a date without time", () => {
    const result = formatDate(new Date("2024-01-15T12:00:00Z"));
    expect(result).toMatch(/15/);
    expect(result).toMatch(/01/);
    expect(result).toMatch(/2024/);
  });

  it("includes time when includeTime=true", () => {
    const result = formatDate(new Date("2024-01-15T14:30:00Z"), true);
    expect(result.length).toBeGreaterThan(10);
  });

  it("accepts string input", () => {
    const result = formatDate("2024-06-01");
    expect(result).toMatch(/2024/);
  });
});
