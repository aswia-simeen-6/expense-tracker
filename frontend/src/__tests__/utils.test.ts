/**
 * Unit tests for pure utility functions used throughout the expense tracker.
 * Run with: npm test
 */

import { describe, it, expect } from "vitest";

// ── Helpers under test (inlined since they're private to components) ──────────

function parseAmount(raw: string): number | null {
  const n = parseFloat(raw);
  if (!isFinite(n) || n <= 0) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return null;
  return n;
}

function formatAmount(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function computeCategoryBreakdown(expenses: { category: string; amount: number }[]) {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    map[e.category] = (map[e.category] ?? 0) + Math.round(e.amount * 100);
  }
  return Object.entries(map)
    .map(([cat, paise]) => ({ cat, amount: paise / 100 }))
    .sort((a, b) => b.amount - a.amount);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("parseAmount", () => {
  it("accepts valid whole-number amounts", () => {
    expect(parseAmount("100")).toBe(100);
    expect(parseAmount("1")).toBe(1);
  });

  it("accepts valid decimal amounts up to 2 dp", () => {
    expect(parseAmount("12.50")).toBe(12.5);
    expect(parseAmount("0.99")).toBe(0.99);
  });

  it("rejects zero", () => {
    expect(parseAmount("0")).toBeNull();
  });

  it("rejects negative amounts", () => {
    expect(parseAmount("-50")).toBeNull();
  });

  it("rejects amounts with more than 2 decimal places", () => {
    expect(parseAmount("10.999")).toBeNull();
    expect(parseAmount("1.123")).toBeNull();
  });

  it("rejects empty string", () => {
    expect(parseAmount("")).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("10abc")).toBeNull();
  });
});

describe("formatAmount", () => {
  it("formats whole rupees with two decimal places", () => {
    expect(formatAmount(100)).toContain("100.00");
    expect(formatAmount(100)).toContain("₹");
  });

  it("formats decimal amounts correctly", () => {
    expect(formatAmount(12.5)).toContain("12.50");
  });

  it("includes thousands separator for large amounts (en-IN style)", () => {
    const result = formatAmount(100000);
    // en-IN uses commas: 1,00,000.00
    expect(result).toContain("₹");
    expect(result).toContain("00,000");
  });
});

describe("formatDate", () => {
  it("formats ISO date string to human-readable form", () => {
    const result = formatDate("2024-01-15");
    expect(result).toContain("Jan");
    expect(result).toContain("2024");
  });

  it("does not shift dates due to UTC/timezone offset", () => {
    // 2024-03-01 should always show March, never February
    const result = formatDate("2024-03-01");
    expect(result).toContain("Mar");
  });
});

describe("computeCategoryBreakdown", () => {
  it("sums amounts within the same category", () => {
    const expenses = [
      { category: "Food", amount: 100 },
      { category: "Food", amount: 50 },
      { category: "Travel", amount: 200 },
    ];
    const breakdown = computeCategoryBreakdown(expenses);
    const food = breakdown.find((r) => r.cat === "Food");
    expect(food?.amount).toBe(150);
  });

  it("sorts by descending amount", () => {
    const expenses = [
      { category: "A", amount: 10 },
      { category: "B", amount: 100 },
      { category: "C", amount: 50 },
    ];
    const breakdown = computeCategoryBreakdown(expenses);
    expect(breakdown[0].cat).toBe("B");
    expect(breakdown[1].cat).toBe("C");
    expect(breakdown[2].cat).toBe("A");
  });

  it("handles floating-point paise precision correctly", () => {
    // 33.33 + 33.33 + 33.34 should equal 100.00, not 99.99999... due to paise rounding
    const expenses = [
      { category: "X", amount: 33.33 },
      { category: "X", amount: 33.33 },
      { category: "X", amount: 33.34 },
    ];
    const breakdown = computeCategoryBreakdown(expenses);
    expect(breakdown[0].amount).toBe(100);
  });

  it("returns empty array for empty input", () => {
    expect(computeCategoryBreakdown([])).toEqual([]);
  });
});
