import { useState } from "react";
import SearchForm from "./components/SearchForm";
import RecipeList from "./components/RecipeList";
import IngredientSuggestions from "./components/IngredientSuggestions";

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (formData) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch("http://localhost:8000/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setRecipes(data.recipes);

      const ingQuery = formData.ingredients.join(",");
      const sugRes = await fetch(
        `http://localhost:8000/api/suggest-ingredients?ingredients=${encodeURIComponent(ingQuery)}`
      );
      const sugData = await sugRes.json();
      setSuggestions(sugData.suggestions);
    } catch (err) {
      setError("Could not reach the backend. Is uvicorn running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      {/* Header */}
      <header style={{ backgroundColor: "var(--green-deep)" }} className="px-8 py-8 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--green-light)" }}>
            CMPSC 441 · Intelligent Systems
          </p>
          <h1 className="font-display text-4xl font-700 text-white leading-tight">
            Recipe Recommender
          </h1>
          <p className="mt-2 text-sm font-light" style={{ color: "#A7C4B5" }}>
            Powered by TF-IDF vectorization &amp; conditional probability
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <SearchForm onSearch={handleSearch} loading={loading} />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {suggestions.length > 0 && (
          <IngredientSuggestions suggestions={suggestions} />
        )}

        {searched && !loading && recipes.length === 0 && !error && (
          <div className="text-center py-16 text-gray-400 font-display text-xl italic">
            No recipes found. Try different ingredients or filters.
          </div>
        )}

        <RecipeList recipes={recipes} loading={loading} />
      </main>

      <footer className="text-center py-8 text-xs" style={{ color: "var(--text-light)" }}>
        Jack Demtshuk · Rebecca Nanayakkara · Samuel Shtrambrand
      </footer>
    </div>
  );
}