package store

import (
	"database/sql"
	"fmt"
	"math"

	"expense-tracker/model"

	_ "modernc.org/sqlite"
)

type Store struct {
	db *sql.DB
}

func New(path string) (*Store, error) {
	dsn := path + "?_journal_mode=WAL&_foreign_keys=on&_busy_timeout=5000"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open: %w", err)
	}
	db.SetMaxOpenConns(1)
	if err := migrate(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("migrate: %w", err)
	}
	return &Store{db: db}, nil
}

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS expenses (
			id              TEXT    PRIMARY KEY,
			idempotency_key TEXT    NOT NULL UNIQUE,
			amount_paise    INTEGER NOT NULL CHECK(amount_paise > 0),
			category        TEXT    NOT NULL,
			description     TEXT    NOT NULL,
			date            TEXT    NOT NULL,
			created_at      TEXT    NOT NULL
				DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
		);
		CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
		CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(date);
	`)
	return err
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) CreateExpense(req model.CreateExpenseRequest, id string) (*model.Expense, bool, error) {
	paise := rupeeToInt(req.Amount)
	res, err := s.db.Exec(`
		INSERT INTO expenses (id, idempotency_key, amount_paise, category, description, date)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(idempotency_key) DO NOTHING
	`, id, req.IdempotencyKey, paise, req.Category, req.Description, req.Date)
	if err != nil {
		return nil, false, fmt.Errorf("insert: %w", err)
	}
	n, _ := res.RowsAffected()
	created := n > 0

	row := s.db.QueryRow(`
		SELECT id, amount_paise, category, description, date, created_at
		FROM expenses WHERE idempotency_key = ?
	`, req.IdempotencyKey)
	expense, err := scanOne(row)
	if err != nil {
		return nil, false, fmt.Errorf("fetch after insert: %w", err)
	}
	return expense, created, nil
}

func (s *Store) UpdateExpense(id string, req model.UpdateExpenseRequest) (*model.Expense, error) {
	paise := rupeeToInt(req.Amount)
	res, err := s.db.Exec(`
		UPDATE expenses SET amount_paise = ?, description = ? WHERE id = ?
	`, paise, req.Description, id)
	if err != nil {
		return nil, fmt.Errorf("update: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return nil, fmt.Errorf("not found")
	}
	row := s.db.QueryRow(`
		SELECT id, amount_paise, category, description, date, created_at
		FROM expenses WHERE id = ?
	`, id)
	return scanOne(row)
}

func (s *Store) DeleteExpense(id string) error {
	res, err := s.db.Exec(`DELETE FROM expenses WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("not found")
	}
	return nil
}

func (s *Store) ListExpenses(q model.ListQuery) ([]model.Expense, error) {
	query := `
		SELECT id, amount_paise, category, description, date, created_at
		FROM expenses
	`
	args := []any{}
	if q.Category != "" {
		query += " WHERE category = ?"
		args = append(args, q.Category)
	}
	if q.SortDateDesc {
		query += " ORDER BY date DESC, created_at DESC"
	} else {
		query += " ORDER BY date ASC, created_at ASC"
	}
	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	var expenses []model.Expense
	for rows.Next() {
		e, err := scanRow(rows)
		if err != nil {
			return nil, err
		}
		expenses = append(expenses, *e)
	}
	return expenses, rows.Err()
}

type scanner interface{ Scan(...any) error }

func scanOne(row *sql.Row) (*model.Expense, error) {
	var e model.Expense
	var paise int64
	if err := row.Scan(&e.ID, &paise, &e.Category, &e.Description, &e.Date, &e.CreatedAt); err != nil {
		return nil, err
	}
	e.Amount = intToRupee(paise)
	return &e, nil
}

func scanRow(rows *sql.Rows) (*model.Expense, error) {
	var e model.Expense
	var paise int64
	if err := rows.Scan(&e.ID, &paise, &e.Category, &e.Description, &e.Date, &e.CreatedAt); err != nil {
		return nil, err
	}
	e.Amount = intToRupee(paise)
	return &e, nil
}

func rupeeToInt(r float64) int64 { return int64(math.Round(r * 100)) }
func intToRupee(p int64) float64 { return float64(p) / 100 }
