import type { CreateExpensePayload, Expense, ListResponse, UpdateExpensePayload } from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

export class ApiResponseError extends Error {
  constructor(public readonly status: number, public readonly messages: string[]) {
    super(messages.join("; "));
    this.name = "ApiResponseError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }
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
    if (params.sort) qs.set("sort", params.sort);
    const suffix = qs.size ? `?${qs}` : "";
    return fetch(`${BASE}/expenses${suffix}`).then((r) => handleResponse<ListResponse>(r));
  },

  updateExpense(id: string, payload: UpdateExpensePayload): Promise<Expense> {
    return fetch(`${BASE}/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => handleResponse<Expense>(r));
  },

  deleteExpense(id: string): Promise<void> {
    return fetch(`${BASE}/expenses/${id}`, { method: "DELETE" }).then((r) =>
      handleResponse<void>(r)
    );
  },
};
