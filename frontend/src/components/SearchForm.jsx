import { useState, useEffect } from "react";

export default function SearchForm({ onSearch, loading }) {
  const [ingredientInput, setIngredientInput] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [maxCalories, setMaxCalories] = useState("");
  const [maxCookTime, setMaxCookTime] = useState("");
  const [cuisines, setCuisines] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/cuisines")
      .then((r) => r.json())
      .then((d) => setCuisines(d.cuisines))
      .catch(() => {});
  }, []);

  const handleSubmit = () => {
    const ingredients = ingredientInput
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);
    if (ingredients.length === 0) return;
    onSearch({
      ingredients,
      cuisine: cuisine || null,
      max_calories: maxCalories ? parseInt(maxCalories) : null,
      max_cook_time: maxCookTime ? parseInt(maxCookTime) : null,
      dietary_restrictions: [],
    });
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Ingredients (comma-separated)
        </label>
        <input
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. garlic, olive oil, tomato, basil"
          value={ingredientInput}
          onChange={(e) => setIngredientInput(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Cuisine
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white capitalize"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
          >
            <option value="">Any cuisine</option>
            {cuisines.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Max Calories
          </label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. 800"
            value={maxCalories}
            onChange={(e) => setMaxCalories(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Max Cook Time (min)
          </label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. 30"
            value={maxCookTime}
            onChange={(e) => setMaxCookTime(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Finding recipes..." : "Find Recipes"}
      </button>
    </div>
  );
}