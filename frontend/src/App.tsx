import { useMemo, useState } from "react";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpenseList } from "./components/ExpenseList";
import { useExpenses } from "./hooks/useExpenses";

export default function App() {
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("date_desc");

  // Filtered view shown in the table
  const { expenses, total, loading, error, refetch } = useExpenses({ category, sort });

  // Unfiltered view — used ONLY to derive the full category list.
  // BUG FIX: We now expose refetchAll so that when an expense is created,
  // updated, or deleted, BOTH hook instances are refreshed. Previously only
  // the filtered hook was refetched, so new categories never appeared.
  const { expenses: allExpenses, refetch: refetchAll } = useExpenses({ category: "", sort: "" });

  const categories = useMemo(
    () => [...new Set(allExpenses.map((e) => e.category))].sort(),
    [allExpenses]
  );

  // Call this everywhere a mutation happens (create / update / delete).
  const refetchBoth = () => {
    refetch();
    refetchAll();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="header-icon">₹</span>
            <div>
              <h1 className="header-title">Expense Tracker</h1>
              <p className="header-sub">Keep your finances clear</p>
            </div>
          </div>
          {!loading && (
            <div className="header-total">
              <span className="header-total-label">Total Tracked</span>
              <span className="header-total-amount">
                ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="app-body">
        <aside className="sidebar">
          <ExpenseForm onCreated={refetchBoth} />
          <CategoryBreakdown expenses={allExpenses} />
        </aside>

        <section className="content">
          <ExpenseList
            expenses={expenses}
            total={total}
            loading={loading}
            error={error}
            category={category}
            sort={sort}
            onCategoryChange={setCategory}
            onSortChange={setSort}
            categories={categories}
            onMutated={refetchBoth}
          />
        </section>
      </main>
    </div>
  );
}
