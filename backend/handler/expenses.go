package handler

import (
	"math"
	"strings"
	"time"

	"expense-tracker/model"
	"expense-tracker/store"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	store *store.Store
}

func New(s *store.Store) *Handler { return &Handler{store: s} }

// POST /api/expenses
func (h *Handler) CreateExpense(c *fiber.Ctx) error {
	var req model.CreateExpenseRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid JSON body")
	}
	req.Category = strings.TrimSpace(req.Category)
	req.Description = strings.TrimSpace(req.Description)
	req.IdempotencyKey = strings.TrimSpace(req.IdempotencyKey)

	if errs := validateCreate(req); len(errs) > 0 {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"errors": errs})
	}

	expense, created, err := h.store.CreateExpense(req, uuid.New().String())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to save expense"})
	}

	status := fiber.StatusOK
	if created {
		status = fiber.StatusCreated
	}
	return c.Status(status).JSON(expense)
}

// GET /api/expenses
func (h *Handler) ListExpenses(c *fiber.Ctx) error {
	q := model.ListQuery{
		Category:     strings.TrimSpace(c.Query("category")),
		SortDateDesc: c.Query("sort") == "date_desc",
	}
	expenses, err := h.store.ListExpenses(q)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to load expenses")
	}
	if expenses == nil {
		expenses = []model.Expense{}
	}
	return c.JSON(fiber.Map{
		"data":  expenses,
		"total": sumPaise(expenses),
	})
}

// PUT /api/expenses/:id
func (h *Handler) UpdateExpense(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	if id == "" {
		return fiber.NewError(fiber.StatusBadRequest, "id is required")
	}

	var req model.UpdateExpenseRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid JSON body")
	}
	req.Description = strings.TrimSpace(req.Description)

	if errs := validateUpdate(req); len(errs) > 0 {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"errors": errs})
	}

	expense, err := h.store.UpdateExpense(id, req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return fiber.NewError(fiber.StatusNotFound, "expense not found")
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update expense"})
	}
	return c.JSON(expense)
}

// DELETE /api/expenses/:id
func (h *Handler) DeleteExpense(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	if id == "" {
		return fiber.NewError(fiber.StatusBadRequest, "id is required")
	}
	if err := h.store.DeleteExpense(id); err != nil {
		if strings.Contains(err.Error(), "not found") {
			return fiber.NewError(fiber.StatusNotFound, "expense not found")
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete expense"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ── validation ────────────────────────────────────────────────────────────────

func validateCreate(req model.CreateExpenseRequest) []string {
	var errs []string
	if req.IdempotencyKey == "" {
		errs = append(errs, "idempotency_key is required")
	}
	errs = append(errs, validateAmount(req.Amount)...)
	if req.Category == "" {
		errs = append(errs, "category is required")
	}
	if req.Description == "" {
		errs = append(errs, "description is required")
	}
	errs = append(errs, validateDate(req.Date)...)
	return errs
}

func validateUpdate(req model.UpdateExpenseRequest) []string {
	var errs []string
	errs = append(errs, validateAmount(req.Amount)...)
	if req.Description == "" {
		errs = append(errs, "description is required")
	}
	return errs
}

func validateAmount(amount float64) []string {
	var errs []string
	switch {
	case amount <= 0:
		errs = append(errs, "amount must be greater than zero")
	case math.Abs(amount-math.Round(amount*100)/100) > 1e-9:
		errs = append(errs, "amount must have at most two decimal places")
	}
	return errs
}

func validateDate(date string) []string {
	if date == "" {
		return []string{"date is required"}
	}
	t, err := time.Parse("2006-01-02", date)
	if err != nil {
		return []string{"date must be YYYY-MM-DD"}
	}
	if t.After(time.Now()) {
		return []string{"date cannot be in the future"}
	}
	return nil
}

func sumPaise(expenses []model.Expense) float64 {
	var total int64
	for _, e := range expenses {
		total += int64(math.Round(e.Amount * 100))
	}
	return float64(total) / 100
}
