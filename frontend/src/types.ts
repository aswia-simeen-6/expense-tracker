export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;       // YYYY-MM-DD
  created_at: string; // ISO 8601
}

export interface CreateExpensePayload {
  idempotency_key: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface ListResponse {
  data: Expense[];
  total: number;
}

export interface ApiError {
  error?: string;
  errors?: string[];
}
