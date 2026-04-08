import { useState } from "react";

function ScoreBar({ value, color }) {
  return (
    <div className="score-bar flex-1">
      <div
        className="score-bar-fill"
        style={{ width: `${Math.round(value * 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function RecipeModal({ recipe, onClose }) {
  if (!recipe) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 relative max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-light"
        >
          ✕
        </button>

        <p className="text-xs uppercase tracking-widest mb-2 font-600" style={{ color: "var(--green-light)" }}>
          {recipe.cuisine !== "unknown" ? recipe.cuisine.replace(/_/g, " ") : recipe.source.replace(/_/g, " ")}
        </p>
        <h2 className="font-display text-2xl font-700 mb-4 leading-snug capitalize" style={{ color: "var(--green-deep)" }}>
          {recipe.name}
        </h2>

        <div className="flex flex-wrap gap-3 mb-5 text-sm" style={{ color: "var(--text-mid)" }}>
          {recipe.calories && (
            <span className="flex items-center gap-1">
              🔥 <strong>{Math.round(recipe.calories)}</strong> cal
            </span>
          )}
          {recipe.cook_time && (
            <span className="flex items-center gap-1">
              ⏱ <strong>{recipe.cook_time}</strong> min
            </span>
          )}
          {recipe.rating && (
            <span className="flex items-center gap-1">
              ⭐ <strong>{Number(recipe.rating).toFixed(1)}</strong>
            </span>
          )}
        </div>

        <div className="mb-5">
          <p className="text-xs uppercase tracking-wider font-600 mb-2" style={{ color: "var(--text-light)" }}>
            Ingredients
          </p>
          <div className="flex flex-wrap gap-2">
            {recipe.ingredients.split(",").map((ing, i) => (
              <span
                key={i}
                className="text-sm px-3 py-1 rounded-full"
                style={{ backgroundColor: "var(--amber-light)", color: "var(--text-dark)" }}
              >
                {ing.trim()}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-xs uppercase tracking-wider font-600 mb-3" style={{ color: "var(--text-light)" }}>
            Match Scores
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-mid)" }}>
              <span className="w-24 shrink-0">Overall</span>
              <ScoreBar value={recipe.score} color="var(--green-mid)" />
              <span className="w-8 text-right font-600">{Math.round(recipe.score * 100)}%</span>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-mid)" }}>
              <span className="w-24 shrink-0">TF-IDF</span>
              <ScoreBar value={recipe.tfidf_score} color="#60A5FA" />
              <span className="w-8 text-right font-600">{Math.round(recipe.tfidf_score * 100)}%</span>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-mid)" }}>
              <span className="w-24 shrink-0">Cond. Prob.</span>
              <ScoreBar value={recipe.cond_prob_score} color="var(--amber)" />
              <span className="w-8 text-right font-600">{Math.round(recipe.cond_prob_score * 100)}%</span>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-mid)" }}>
              <span className="w-24 shrink-0">Coverage</span>
              <ScoreBar value={recipe.coverage_score || 0} color="#A78BFA" />
              <span className="w-8 text-right font-600">{Math.round((recipe.coverage_score || 0) * 100)}%</span>
            </div>
          </div>
        </div>

        {recipe.img_src && (
          <img
            src={recipe.img_src}
            alt={recipe.name}
            className="w-full h-48 object-cover rounded-xl mb-5"
          />
        )}

        {recipe.directions && (
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wider font-600 mb-3" style={{ color: "var(--text-light)" }}>
              Directions
            </p>
            {recipe.source === "raw_recipes" ? (
              <ol className="space-y-2">
                {String(recipe.directions).split("\n").map((step, i) => (
                  <li key={i} className="text-sm leading-relaxed flex gap-2" style={{ color: "var(--text-mid)" }}>
                    <span className="shrink-0 font-600 w-5" style={{ color: "var(--green-light)" }}>
                      {i + 1}.
                    </span>
                    <span>{step.replace(/^\d+\.\s*/, "")}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-mid)" }}>
                {String(recipe.directions).slice(0, 600)}
                {recipe.directions && recipe.directions.length > 600 ? "…" : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecipeList({ recipes = [], loading }) {
  const [selected, setSelected] = useState(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" style={{ opacity: 0.6 - i * 0.1 }} />
        ))}
      </div>
    );
  }

  if (recipes.length === 0) return null;

  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-2xl font-600" style={{ color: "var(--green-deep)" }}>
          Top Recommendations
        </h2>
        <span className="text-sm" style={{ color: "var(--text-light)" }}>
          {recipes.length} results · click to expand
        </span>
      </div>

      <div className="space-y-3">
        {recipes.map((r, i) => (
          <div
            key={i}
            className="recipe-card bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer flex gap-4 items-start"
            onClick={() => setSelected(r)}
          >
            {r.img_src && (
              <img
                src={r.img_src}
                alt={r.name}
                className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-3 mb-1">
                <h3 className="font-600 text-base leading-snug capitalize" style={{ color: "var(--text-dark)" }}>
                  {r.name}
                </h3>
                <span
                  className="text-xs font-700 px-2.5 py-1 rounded-full shrink-0"
                  style={{ backgroundColor: "var(--green-deep)", color: "white" }}
                >
                  {Math.round(r.score * 100)}%
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-xs mb-3" style={{ color: "var(--text-light)" }}>
                {r.cuisine && r.cuisine !== "unknown" && (
                  <span className="capitalize">🌍 {r.cuisine.replace(/_/g, " ")}</span>
                )}
                {r.calories && <span>🔥 {Math.round(r.calories)} cal</span>}
                {r.cook_time && <span>⏱ {r.cook_time} min</span>}
                {r.rating && <span>⭐ {Number(r.rating).toFixed(1)}</span>}
              </div>

              {/* Score bars */}
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-1.5 flex-1 text-xs" style={{ color: "var(--text-light)" }}>
                  <span className="shrink-0">TF-IDF</span>
                  <ScoreBar value={r.tfidf_score} color="#60A5FA" />
                  <span className="shrink-0">{Math.round(r.tfidf_score * 100)}%</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1 text-xs" style={{ color: "var(--text-light)" }}>
                  <span className="shrink-0">CP</span>
                  <ScoreBar value={r.cond_prob_score} color="var(--amber)" />
                  <span className="shrink-0">{Math.round(r.cond_prob_score * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <RecipeModal recipe={selected} onClose={() => setSelected(null)} />
    </>
  );
}