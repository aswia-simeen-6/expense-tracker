export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

export interface CreateExpensePayload {
  idempotency_key: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface UpdateExpensePayload {
  amount: number;
  description: string;
}

export interface ListResponse {
  data: Expense[];
  total: number;
}

export interface ApiError {
  error?: string;
  errors?: string[];
}
