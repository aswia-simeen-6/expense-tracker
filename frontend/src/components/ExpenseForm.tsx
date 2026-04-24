import { useRef, useState } from "react";
import { api, ApiResponseError } from "../api/expenses";

interface Props {
  onCreated: () => void;
}

const DEFAULT_CATEGORY = "";

export function ExpenseForm({ onCreated }: Props) {
  const [amount, setAmount]           = useState("");
  const [category, setCategory]       = useState(DEFAULT_CATEGORY);
  const [description, setDescription] = useState("");
  const [date, setDate]               = useState(today());
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState<string[]>([]);

  // The idempotency key lives in a ref, not state, to prevent re-renders.
  // It is rotated ONLY after a confirmed successful creation so that any retry
  // (double-click, network blip, page reload) sends the same key and the server
  // safely deduplicates the request.
  const idempotencyKey = useRef(crypto.randomUUID());

  const handleSubmit = async () => {
    setErrors([]);

    const parsed = parseAmount(amount);
    if (parsed === null) {
      setErrors(["Amount must be a positive number with up to 2 decimal places"]);
      return;
    }

    setSubmitting(true);
    try {
      await api.createExpense({
        idempotency_key: idempotencyKey.current,
        amount: parsed,
        category,
        description,
        date,
      });

      // Only rotate the key after confirmed success.
      idempotencyKey.current = crypto.randomUUID();

      setAmount("");
      setCategory(DEFAULT_CATEGORY);
      setDescription("");
      setDate(today());
      onCreated();
    } catch (e) {
      if (e instanceof ApiResponseError) {
        setErrors(e.messages);
      } else {
        setErrors(["Network error — please try again"]);
      }
      // Key is intentionally NOT rotated: the retry will be idempotent.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <h2 className="form-title">Add Expense</h2>

      {errors.length > 0 && (
        <div className="error-banner" role="alert">
          {errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
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
            onChange={(e) => setDate(e.target.value)}
            disabled={submitting}
          />
        </label>

        <label className="field">
          <span>Category</span>
          <input
            type="text"
            placeholder="e.g. Food, Rent, Travel"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={submitting}
          />
        </label>

        <label className="field full-width">
          <span>Description</span>
          <input
            type="text"
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />
        </label>
      </div>

      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={submitting}
        aria-busy={submitting}
      >
        {submitting ? "Saving…" : "Add Expense"}
      </button>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns the numeric value if valid (> 0, ≤ 2dp), otherwise null. */
function parseAmount(raw: string): number | null {
  const n = parseFloat(raw);
  if (!isFinite(n) || n <= 0) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return null;
  return n;
}
