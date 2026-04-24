import { useMemo } from "react";
import type { Expense } from "../types";

interface Props {
  expenses: Expense[];
}

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
      <h3 className="breakdown-title">By Category</h3>
      <ul className="breakdown-list">
        {breakdown.map(({ cat, amount }) => {
          const pct = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
          return (
            <li key={cat} className="breakdown-row">
              <span className="breakdown-cat">{cat}</span>
              <div className="breakdown-bar-wrap">
                <div
                  className="breakdown-bar"
                  style={{ width: `${pct.toFixed(1)}%` }}
                />
              </div>
              <span className="breakdown-amount">
                ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
