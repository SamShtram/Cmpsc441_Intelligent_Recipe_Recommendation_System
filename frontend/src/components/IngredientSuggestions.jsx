export default function IngredientSuggestions({ suggestions }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div
      className="rounded-2xl border px-6 py-5"
      style={{ backgroundColor: "var(--amber-light)", borderColor: "#FDE68A" }}
    >
      <p className="text-xs font-600 uppercase tracking-wider mb-3" style={{ color: "var(--amber)" }}>
        💡 Ingredients that pair well with yours
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <span
            key={i}
            className="text-sm px-3 py-1.5 rounded-full font-500 border"
            style={{
              backgroundColor: "white",
              borderColor: "#FDE68A",
              color: "var(--text-dark)"
            }}
          >
            {s.ingredient}
            <span className="ml-1.5 text-xs" style={{ color: "var(--amber)" }}>
              {Math.round(s.probability * 100)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}