import { useMemo } from "react";
import type { Expense } from "../types";

interface Props { expenses: Expense[]; }

const PALETTE = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
];

export function CategoryBreakdown({ expenses }: Props) {
  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] ?? 0) + Math.round(e.amount * 100);
    }
    return Object.entries(map)
      .map(([cat, paise]) => ({ cat, amount: paise / 100 }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  if (breakdown.length === 0) return null;

  const grandTotal = breakdown.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="breakdown-card">
      <h3 className="breakdown-title">
        <span>By Category</span>
        <span className="breakdown-count">{breakdown.length} categories</span>
      </h3>
      <ul className="breakdown-list">
        {breakdown.map(({ cat, amount }, i) => {
          const pct = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
          const color = PALETTE[i % PALETTE.length];
          return (
            <li key={cat} className="breakdown-row">
              <div className="breakdown-top">
                <span className="breakdown-dot" style={{ background: color }} />
                <span className="breakdown-cat">{cat}</span>
                <span className="breakdown-pct">{pct.toFixed(0)}%</span>
                <span className="breakdown-amount">
                  ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="breakdown-bar-wrap">
                <div
                  className="breakdown-bar"
                  style={{ width: `${pct.toFixed(1)}%`, background: color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
