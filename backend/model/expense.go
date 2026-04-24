package model

type Expense struct {
	ID          string  `json:"id"`
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
	Date        string  `json:"date"`
	CreatedAt   string  `json:"created_at"`
}

type CreateExpenseRequest struct {
	IdempotencyKey string  `json:"idempotency_key"`
	Amount         float64 `json:"amount"`
	Category       string  `json:"category"`
	Description    string  `json:"description"`
	Date           string  `json:"date"`
}

type UpdateExpenseRequest struct {
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
}

type ListQuery struct {
	Category     string
	SortDateDesc bool
}
