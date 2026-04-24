import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/expenses";
import type { Expense } from "../types";

interface UseExpensesOptions {
  category: string;
  sort: string;
}

interface UseExpensesResult {
  expenses: Expense[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useExpenses({ category, sort }: UseExpensesOptions): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Track the latest request so stale responses from a slow network are dropped.
  const reqId = useRef(0);

  const fetch = useCallback(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);

    api
      .listExpenses({ category: category || undefined, sort: sort || undefined })
      .then((res) => {
        if (reqId.current !== id) return; // stale
        setExpenses(res.data);
        setTotal(res.total);
      })
      .catch((e) => {
        if (reqId.current !== id) return;
        setError(e.message ?? "Failed to load expenses");
      })
      .finally(() => {
        if (reqId.current === id) setLoading(false);
      });
  }, [category, sort]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { expenses, total, loading, error, refetch: fetch };
}
