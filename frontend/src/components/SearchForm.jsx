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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white transition-all duration-200";
  const labelClass = "block text-xs font-600 uppercase tracking-wider mb-2";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
      <h2 className="font-display text-xl font-600 mb-6" style={{ color: "var(--green-deep)" }}>
        What's in your kitchen?
      </h2>

      <div className="mb-5">
        <label className={labelClass} style={{ color: "var(--text-mid)" }}>
          Ingredients
        </label>
        <input
          className={inputClass}
          placeholder="e.g. chicken, garlic, lemon, olive oil"
          value={ingredientInput}
          onChange={(e) => setIngredientInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <p className="text-xs mt-1.5" style={{ color: "var(--text-light)" }}>
          Separate ingredients with commas
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className={labelClass} style={{ color: "var(--text-mid)" }}>Cuisine</label>
          <select
            className={inputClass + " capitalize cursor-pointer"}
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
          >
            <option value="">Any cuisine</option>
            {cuisines.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--text-mid)" }}>Max Calories</label>
          <input
            type="number"
            className={inputClass}
            placeholder="e.g. 800"
            value={maxCalories}
            onChange={(e) => setMaxCalories(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--text-mid)" }}>Max Cook Time (min)</label>
          <input
            type="number"
            className={inputClass}
            placeholder="e.g. 30"
            value={maxCookTime}
            onChange={(e) => setMaxCookTime(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full text-white font-600 py-3.5 rounded-xl text-sm tracking-wide transition-all duration-200 disabled:opacity-50"
        style={{ backgroundColor: loading ? "var(--green-mid)" : "var(--green-deep)" }}
        onMouseEnter={e => !loading && (e.target.style.backgroundColor = "var(--green-mid)")}
        onMouseLeave={e => !loading && (e.target.style.backgroundColor = "var(--green-deep)")}
      >
        {loading ? "Finding recipes…" : "Find Recipes →"}
      </button>
    </div>
  );
}