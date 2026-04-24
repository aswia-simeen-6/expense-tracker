import type { CreateExpensePayload, Expense, ListResponse } from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

class ApiResponseError extends Error {
  constructor(
    public readonly status: number,
    public readonly messages: string[]
  ) {
    super(messages.join("; "));
    this.name = "ApiResponseError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;

  let messages: string[];
  try {
    const body = await res.json();
    messages = body.errors ?? (body.error ? [body.error] : ["Unexpected error"]);
  } catch {
    messages = [`HTTP ${res.status}`];
  }
  throw new ApiResponseError(res.status, messages);
}

export const api = {
  createExpense(payload: CreateExpensePayload): Promise<Expense> {
    return fetch(`${BASE}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => handleResponse<Expense>(r));
  },

  listExpenses(params: { category?: string; sort?: string } = {}): Promise<ListResponse> {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.sort)     qs.set("sort", params.sort);
    const suffix = qs.size ? `?${qs}` : "";
    return fetch(`${BASE}/expenses${suffix}`).then((r) =>
      handleResponse<ListResponse>(r)
    );
  },
};

export { ApiResponseError };
