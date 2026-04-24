import { useState } from "react";
import { api, ApiResponseError } from "../api/expenses";
import type { Expense } from "../types";
import { EditModal } from "./EditModal";

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
  onMutated: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────
function formatAmount(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function getMonthKey(iso: string): string {
  // Returns "YYYY-MM"
  return iso.slice(0, 7);
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function groupByMonth(expenses: Expense[]): { key: string; label: string; items: Expense[]; subtotal: number }[] {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const k = getMonthKey(e.date);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(e);
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    key,
    label: formatMonthLabel(key),
    items,
    subtotal: items.reduce((s, i) => s + i.amount, 0),
  }));
}

// ── Expense Row ───────────────────────────────────────────────────
interface RowProps {
  expense: Expense;
  idx: number;
  deletingId: string | null;
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
}

function ExpenseRow({ expense: e, idx, deletingId, onEdit, onDelete }: RowProps) {
  return (
    <tr
      className={deletingId === e.id ? "row-deleting" : ""}
      style={{ animationDelay: `${idx * 40}ms` }}
    >
      <td className="date-cell">{formatDate(e.date)}</td>
      <td><span className="category-badge">{e.category}</span></td>
      <td className="desc-cell" title={e.description}>{e.description}</td>
      <td className="amount-cell">{formatAmount(e.amount)}</td>
      <td className="actions-cell">
        <button
          className="btn-icon btn-edit"
          onClick={() => onEdit(e)}
          title="Edit expense"
          disabled={deletingId === e.id}
        >✎</button>
        <button
          className="btn-icon btn-delete"
          onClick={() => onDelete(e.id)}
          title="Delete expense"
          disabled={deletingId === e.id}
        >
          {deletingId === e.id ? <span className="spinner spinner-sm" /> : "✕"}
        </button>
      </td>
    </tr>
  );
}

// ── Main Component ────────────────────────────────────────────────
export function ExpenseList({
  expenses, total, loading, error,
  category, sort, onCategoryChange, onSortChange, categories, onMutated,
}: Props) {
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [monthlyView, setMonthlyView] = useState(false);
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    setDeletingId(id);
    try {
      await api.deleteExpense(id);
      onMutated();
    } catch (e) {
      if (e instanceof ApiResponseError) setDeleteError(e.messages[0]);
      else setDeleteError("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleMonth = (key: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const monthGroups = monthlyView ? groupByMonth(expenses) : [];

  const tableHead = (
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Description</th>
        <th className="amount-col">Amount</th>
        <th className="actions-col">Actions</th>
      </tr>
    </thead>
  );

  return (
    <>
      {editing && (
        <EditModal expense={editing} onClose={() => setEditing(null)} onSaved={onMutated} />
      )}

      <div className="list-section">
        <div className="list-controls">
          <h2 className="list-title">Expenses</h2>
          <div className="controls-row">
            {/* Monthly toggle */}
            <label className="view-toggle" title="Toggle monthly grouping">
              <input
                type="checkbox"
                checked={monthlyView}
                onChange={(e) => setMonthlyView(e.target.checked)}
              />
              <span className="view-toggle-track">
                <span className="view-toggle-thumb" />
              </span>
              <span className="view-toggle-label">Monthly</span>
            </label>

            <label className="control-field">
              <span>Category</span>
              <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="control-field">
              <span>Sort</span>
              <select value={sort} onChange={(e) => onSortChange(e.target.value)}>
                <option value="date_desc">Newest first</option>
                <option value="">Oldest first</option>
              </select>
            </label>
          </div>
        </div>

        {(error || deleteError) && (
          <div className="error-banner" role="alert">
            <p>⚠ {error || deleteError}</p>
          </div>
        )}

        {loading ? (
          <div className="skeleton-wrapper">
            {[1, 2, 3].map((n) => (
              <div key={n} className="skeleton-row">
                <div className="skeleton skeleton-date" />
                <div className="skeleton skeleton-badge" />
                <div className="skeleton skeleton-desc" />
                <div className="skeleton skeleton-amt" />
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p className="empty-title">No expenses yet</p>
            <p className="empty-sub">
              {category
                ? `No expenses in "${category}" — try clearing the filter.`
                : "Add your first expense using the form."}
            </p>
          </div>
        ) : monthlyView ? (
          /* ── Monthly grouped view ── */
          <div className="monthly-wrapper">
            {monthGroups.map((group) => {
              const collapsed = collapsedMonths.has(group.key);
              return (
                <div key={group.key} className="month-group">
                  <button
                    className="month-header"
                    onClick={() => toggleMonth(group.key)}
                    aria-expanded={!collapsed}
                  >
                    <span className="month-chevron">{collapsed ? "›" : "⌄"}</span>
                    <span className="month-label">{group.label}</span>
                    <span className="month-meta">
                      {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                    </span>
                    <span className="month-subtotal">{formatAmount(group.subtotal)}</span>
                  </button>
                  {!collapsed && (
                    <div className="table-wrapper">
                      <table className="expense-table">
                        {tableHead}
                        <tbody>
                          {group.items.map((e, idx) => (
                            <ExpenseRow
                              key={e.id}
                              expense={e}
                              idx={idx}
                              deletingId={deletingId}
                              onEdit={setEditing}
                              onDelete={handleDelete}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Flat view ── */
          <div className="table-wrapper">
            <table className="expense-table">
              {tableHead}
              <tbody>
                {expenses.map((e, idx) => (
                  <ExpenseRow
                    key={e.id}
                    expense={e}
                    idx={idx}
                    deletingId={deletingId}
                    onEdit={setEditing}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <div className="total-row">
            <span className="total-label">
              Total · {expenses.length} item{expenses.length !== 1 ? "s" : ""}
              {category && <span className="total-filter-note"> in "{category}"</span>}
            </span>
            <span className="total-amount">{formatAmount(total)}</span>
          </div>
        )}
      </div>
    </>
  );
}
