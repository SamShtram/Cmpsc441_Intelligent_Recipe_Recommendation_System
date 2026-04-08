export default function RecipeList({ recipes = [] }) {
  if (recipes.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Top Recommendations ({recipes.length})
      </h2>
      <div className="space-y-4">
        {recipes.map((r, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500 flex gap-4"
          >
            {r.img_src && (
              <img
                src={r.img_src}
                alt={r.name}
                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-lg font-semibold text-gray-800 leading-tight">
                  {r.name}
                </h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                  {(r.score * 100).toFixed(0)}% match
                </span>
              </div>

              <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                {r.cuisine && r.cuisine !== "unknown" && (
                  <span className="capitalize">🌍 {r.cuisine.replace(/_/g, " ")}</span>
                )}
                {r.cook_time && <span>⏱ {r.cook_time} min</span>}
                {r.rating && <span>⭐ {Number(r.rating).toFixed(1)}</span>}
              </div>

              <p className="text-sm text-gray-400 mt-2 truncate">{r.ingredients}</p>

              <div className="flex gap-3 mt-1 text-xs text-gray-400">
                <span title="TF-IDF">TF-IDF: {(r.tfidf_score * 100).toFixed(0)}%</span>
                <span title="Conditional Probability">CondProb: {(r.cond_prob_score * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}