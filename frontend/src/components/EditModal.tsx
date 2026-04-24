import { useEffect, useRef, useState } from "react";
import { api, ApiResponseError } from "../api/expenses";
import type { Expense } from "../types";

interface Props {
  expense: Expense;
  onClose: () => void;
  onSaved: () => void;
}

export function EditModal({ expense, onClose, onSaved }: Props) {
  const [amount, setAmount] = useState(String(expense.amount));
  const [description, setDescription] = useState(expense.description);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSave = async () => {
    setErrors([]);
    const parsed = parseAmount(amount);
    const localErrors: string[] = [];
    if (parsed === null) localErrors.push("Amount must be a positive number with up to 2 decimal places");
    if (!description.trim()) localErrors.push("Description is required");
    if (localErrors.length > 0) { setErrors(localErrors); return; }

    setSaving(true);
    try {
      await api.updateExpense(expense.id, { amount: parsed!, description: description.trim() });
      onSaved();
      onClose();
    } catch (e) {
      if (e instanceof ApiResponseError) setErrors(e.messages);
      else setErrors(["Network error — please try again"]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Edit expense">
        <div className="modal-header">
          <h3 className="modal-title">Edit Expense</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-meta">
          <span className="category-badge">{expense.category}</span>
          <span className="modal-date">{formatDate(expense.date)}</span>
        </div>

        {errors.length > 0 && (
          <div className="error-banner" role="alert">
            {errors.map((e, i) => <p key={i}>⚠ {e}</p>)}
          </div>
        )}

        <div className="field-grid">
          <label className="field">
            <span>Amount (₹)</span>
            <input
              ref={inputRef}
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={saving}
            />
          </label>

          <label className="field full-width">
            <span>Description</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="btn-loading"><span className="spinner" /> Saving…</span> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function parseAmount(raw: string): number | null {
  const n = parseFloat(raw);
  if (!isFinite(n) || n <= 0) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return null;
  return n;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
