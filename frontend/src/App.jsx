import { useState } from "react";
import SearchForm from "./components/SearchForm";
import RecipeList from "./components/RecipeList";
import IngredientSuggestions from "./components/IngredientSuggestions.jsx";

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setRecipes(data.recipes);

      // Also fetch ingredient suggestions
      const ingQuery = formData.ingredients.join(",");
      const sugRes = await fetch(
        `http://localhost:8000/api/suggest-ingredients?ingredients=${encodeURIComponent(ingQuery)}`
      );
      const sugData = await sugRes.json();
      setSuggestions(sugData.suggestions);
    } catch (err) {
      setError("Failed to fetch recommendations. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white py-6 px-8 shadow">
        <h1 className="text-3xl font-bold">🍽️ Intelligent Recipe Recommender</h1>
        <p className="text-green-200 mt-1 text-sm">
          Enter ingredients you have and we'll find the best recipes for you.
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <SearchForm onSearch={handleSearch} loading={loading} />
        {error && <p className="text-red-600">{error}</p>}
        {suggestions.length > 0 && (
          <IngredientSuggestions suggestions={suggestions} />
        )}
        <RecipeList recipes={recipes} />
      </main>
    </div>
  );
}