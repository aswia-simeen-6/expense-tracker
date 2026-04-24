import { useEffect, useRef, useState } from "react";
import { api, ApiResponseError } from "../api/expenses";

interface Props {
  onCreated: () => void;
}

// ── LocalStorage helpers ──────────────────────────────────────────
const LS_KEY = "expense_category_history";

function loadCategoryHistory(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveCategoryUsage(cat: string): void {
  const hist = loadCategoryHistory();
  hist[cat] = (hist[cat] ?? 0) + 1;
  localStorage.setItem(LS_KEY, JSON.stringify(hist));
}

function getTopCategories(n = 3): string[] {
  const hist = loadCategoryHistory();
  return Object.entries(hist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([cat]) => cat);
}

// ── Component ─────────────────────────────────────────────────────
export function ExpenseForm({ onCreated }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const [suggestion, setSuggestion] = useState<string>("");
  const [topCategories, setTopCategories] = useState<string[]>([]);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const idempotencyKey = useRef(crypto.randomUUID());

  const refreshTopCategories = () => setTopCategories(getTopCategories(3));
  useEffect(() => { refreshTopCategories(); }, []);

  useEffect(() => {
    if (!category.trim()) { setSuggestion(""); return; }
    const hist = loadCategoryHistory();
    const lower = category.toLowerCase();
    const match = Object.keys(hist).find(
      (k) => k.toLowerCase().startsWith(lower) && k.toLowerCase() !== lower
    );
    setSuggestion(match ?? "");
  }, [category]);

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && suggestion) {
      e.preventDefault();
      setCategory(suggestion);
      setSuggestion("");
    }
  };

  const handleSubmit = async () => {
    setErrors([]);
    setSuccess(false);

    const localErrors: string[] = [];
    const parsed = parseAmount(amount);
    if (parsed === null) localErrors.push("Amount must be a positive number with up to 2 decimal places");
    if (!category.trim()) localErrors.push("Category is required");
    if (!description.trim()) localErrors.push("Description is required");
    if (!date) {
      localErrors.push("Date is required");
    } else if (new Date(date) > new Date()) {
      localErrors.push("Date cannot be in the future");
    }
    if (localErrors.length > 0) { setErrors(localErrors); return; }

    setSubmitting(true);
    try {
      await api.createExpense({
        idempotency_key: idempotencyKey.current,
        amount: parsed!,
        category: category.trim(),
        description: description.trim(),
        date,
      });
      saveCategoryUsage(category.trim());
      idempotencyKey.current = crypto.randomUUID();
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(today());
      setSuccess(true);
      refreshTopCategories();
      setTimeout(() => setSuccess(false), 2500);
      onCreated();
    } catch (e) {
      if (e instanceof ApiResponseError) setErrors(e.messages);
      else setErrors(["Network error — please try again"]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <h2 className="form-title">
        <span className="form-title-icon">+</span>
        Add Expense
      </h2>

      {errors.length > 0 && (
        <div className="error-banner" role="alert">
          {errors.map((e, i) => <p key={i}>⚠ {e}</p>)}
        </div>
      )}
      {success && (
        <div className="success-banner" role="status">
          ✓ Expense added successfully!
        </div>
      )}

      <div className="field-grid">
        <label className="field">
          <span>Amount (₹)</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={submitting}
          />
        </label>

        <label className="field">
          <span>Date</span>
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            disabled={submitting}
            className="date-input"
          />
        </label>

        <div className="field full-width">
          <span>Category</span>
          <div className="category-input-wrap">
            <input
              ref={categoryInputRef}
              type="text"
              placeholder="e.g. Food, Rent, Travel"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onKeyDown={handleCategoryKeyDown}
              disabled={submitting}
              autoComplete="off"
            />
            {suggestion && (
              <span className="category-ghost" aria-hidden="true">
                <span className="category-ghost-typed">{category}</span>
                <span className="category-ghost-rest">{suggestion.slice(category.length)}</span>
                <kbd className="tab-hint">Tab</kbd>
              </span>
            )}
          </div>
          {topCategories.length > 0 && (
            <div className="category-tags" role="group" aria-label="Recent categories">
              {topCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={"category-tag" + (category === cat ? " category-tag--active" : "")}
                  onClick={() => { setCategory(cat); categoryInputRef.current?.focus(); }}
                  disabled={submitting}
                  title={"Use category: " + cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="field full-width">
          <span>Description</span>
          <input
            type="text"
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </label>
      </div>

      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={submitting}
        aria-busy={submitting}
      >
        {submitting ? (
          <span className="btn-loading"><span className="spinner" /> Saving…</span>
        ) : (
          "Add Expense"
        )}
      </button>
    </div>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseAmount(raw: string): number | null {
  const n = parseFloat(raw);
  if (!isFinite(n) || n <= 0) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return null;
  return n;
}
