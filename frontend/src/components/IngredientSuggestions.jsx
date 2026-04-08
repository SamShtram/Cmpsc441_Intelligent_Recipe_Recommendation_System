export default function IngredientSuggestions({ suggestions }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-yellow-800 mb-2">
        💡 You might also want to add:
      </h3>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <span
            key={i}
            className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full"
          >
            {s.ingredient} ({(s.probability * 100).toFixed(0)}%)
          </span>
        ))}
      </div>
    </div>
  );
}