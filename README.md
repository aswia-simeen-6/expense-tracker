# 💸 Expense Tracker

![React](https://img.shields.io/badge/Frontend-React-blue)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)
![Go](https://img.shields.io/badge/Backend-Go-00ADD8)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey)
![License](https://img.shields.io/badge/License-MIT-green)

A **full-stack expense management application** built with **React + TypeScript (Frontend)** and **Go Fiber + SQLite (Backend)**.

This application allows users to **track daily expenses, categorize spending, and analyze financial behavior** with a clean and responsive interface.

---

# 🎯 Problem Statement

Managing personal expenses manually is inefficient and error-prone.  
This project solves that by providing a structured system to:

- Record expenses in real-time
- Organize them by category
- Track monthly spending
- Analyze where money is being spent

---

# 🚀 Features

## 🖥️ Frontend Features
- Add / Edit / Delete expenses
- Category-based filtering
- Sorting (Newest / Oldest)
- Monthly grouped view
- Category breakdown visualization
- Auto-suggest categories (LocalStorage)
- Loading skeletons & error handling
- Responsive UI

---

## ⚙️ Backend Features
- RESTful API design
- Full CRUD operations
- Idempotent expense creation
- SQLite database storage
- Input validation
- Optimized queries

---

# 🏗️ Architecture

```
Frontend (React + TypeScript)
        |
        v
REST API (Go Fiber)
        |
        v
SQLite Database
```

---

# 📂 Project Structure

```
expense-tracker/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── App.tsx
│
├── backend/
│   ├── handler/
│   ├── model/
│   ├── store/
│   └── main.go
│
└── README.md
```

---

# 🎯 Frontend Architecture

## Key Components

### ExpenseForm
- Handles expense creation
- Input validation
- Category suggestions

### ExpenseList
- Displays all expenses
- Sorting & filtering
- Delete/Edit actions

### EditModal
- Update existing expense

### CategoryBreakdown
- Shows category-wise distribution

---

## Custom Hook

### useExpenses()
Centralized logic for:
- API calls
- loading state
- error handling
- re-fetching

---

# ⚙️ Backend Architecture

## handler/
Handles HTTP requests and responses

## model/
Defines request/response structures

## store/
Handles database queries and persistence

---

# 🔌 API Endpoints

## Create Expense
POST /api/expenses

```json
{
  "idempotency_key": "unique-key",
  "amount": 250,
  "category": "Food",
  "description": "Lunch",
  "date": "2026-04-24"
}
```

---

## Get Expenses
GET /api/expenses

---

## Update Expense
PUT /api/expenses/:id

---

## Delete Expense
DELETE /api/expenses/:id

---

# 💾 Database Schema

```sql
CREATE TABLE expenses (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT UNIQUE,
    amount_paise INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```

---

# 🧠 Key Design Decisions

### 1. Amount stored in paise
Avoids floating point precision issues.

### 2. Idempotency key
Prevents duplicate expense entries.

### 3. Layered backend
Improves scalability and maintainability.

### 4. Custom React hook
Separates business logic from UI.

---

# ⚖️ Trade-offs (Time Constraints)

- No authentication
- No pagination
- No test coverage
- No Docker setup

---

# 🚫 Intentionally Not Included

- Multi-user system
- Cloud database
- Role-based access
- Advanced analytics

---

# 🔮 Future Enhancements

- JWT authentication
- Charts & dashboards
- Export reports
- Budget alerts
- AI-based insights

---

# ▶️ Run Locally

## Frontend
```bash
cd frontend
npm install
npm run dev
```

## Backend
```bash
cd backend
go run main.go
```

---

# 🌟 Why This Project Stands Out

- Full-stack implementation
- Clean architecture
- Scalable design
- Real-world usability
- Strong backend + frontend integration

---

# 👨‍💻 Author

Built with focus on clean code, performance, and scalability.
