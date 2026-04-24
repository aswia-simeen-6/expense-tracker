import type { Expense } from "../types";

interface Props {
  expenses: Expense[];
  total: number;
  loading: boolean;
  error: string | null;
  category: string;
  sort: string;
  onCategoryChange: (c: string) => void;
  onSortChange: (s: string) => void;
  categories: string[];
}

export function ExpenseList({
  expenses,
  total,
  loading,
  error,
  category,
  sort,
  onCategoryChange,
  onSortChange,
  categories,
}: Props) {
  return (
    <div className="list-section">
      <div className="list-controls">
        <h2 className="list-title">Expenses</h2>

        <div className="controls-row">
          <label className="control-field">
            <span>Category</span>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="control-field">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="date_desc">Newest first</option>
              <option value="">Oldest first</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="loading-row">Loading…</div>
      ) : expenses.length === 0 ? (
        <div className="empty-row">No expenses found.</div>
      ) : (
        <div className="table-wrapper">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th className="amount-col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="date-cell">{formatDate(e.date)}</td>
                  <td><span className="category-badge">{e.category}</span></td>
                  <td className="desc-cell">{e.description}</td>
                  <td className="amount-cell">{formatAmount(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <div className="total-row">
          <span>Total ({expenses.length} item{expenses.length !== 1 ? "s" : ""})</span>
          <span className="total-amount">{formatAmount(total)}</span>
        </div>
      )}
    </div>
  );
}

function formatAmount(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  // Parse as local date to avoid timezone shifts on YYYY-MM-DD strings.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
