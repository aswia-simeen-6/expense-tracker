import { useMemo, useState } from "react";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpenseList } from "./components/ExpenseList";
import { useExpenses } from "./hooks/useExpenses";

export default function App() {
  const [category, setCategory] = useState("");
  const [sort, setSort]         = useState("date_desc");

  const { expenses, total, loading, error, refetch } = useExpenses({ category, sort });

  // Derive the full category list from whatever is currently loaded.
  // For a filtered view we still want all categories in the dropdown,
  // so we keep a separate unfiltered fetch — but for simplicity at this
  // scale we just extract them from the unfiltered data on mount by
  // passing an empty category to the list endpoint via a second hook call.
  const { expenses: allExpenses } = useExpenses({ category: "", sort: "" });
  const categories = useMemo(
    () => [...new Set(allExpenses.map((e) => e.category))].sort(),
    [allExpenses]
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>Expense Tracker</h1>
      </header>

      <main className="app-body">
        <aside className="sidebar">
          <ExpenseForm onCreated={refetch} />
          <CategoryBreakdown expenses={expenses} />
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
          />
        </section>
      </main>
    </div>
  );
}
