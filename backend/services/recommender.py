import ast
import json
import re
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict

DATA_DIR = Path(__file__).parent.parent.parent / "data"


class RecipeRecommender:
    def __init__(self):
        self.df = None
        self.vectorizer = TfidfVectorizer()
        self.tfidf_matrix = None
        self.co_occurrence = defaultdict(lambda: defaultdict(int))
        self.ingredient_counts = defaultdict(int)
        self._load_data()

    # ------------------------------------------------------------------
    # Data loading
    # ------------------------------------------------------------------

    def _load_data(self):
        """
        Merge all available datasets into one unified DataFrame.

        Sources (all optional, merged when present):
          RAW_recipes.csv  — 231 637 Food.com recipes: name, ingredients,
                             minutes (cook time), nutrition [calories,...], tags
          recipes.csv      — 1 090 Allrecipes records: name, cook_time, rating, img_src
          test_recipes.csv — 59 records with structured ingredient JSON objects
          train.json       — 39 774 Kaggle "What's Cooking": cuisine + ingredients
          test.json        — 9 944 Kaggle records, ingredients only

        Unified schema:
          id, name, cuisine, ingredients (comma string), cook_time (int mins),
          calories (float), rating (float), img_src, directions, tags, source
        """
        frames = []
        id_counter = 0

        # --- RAW_recipes.csv (Food.com) ---
        raw_path = DATA_DIR / "RAW_recipes.csv"
        if raw_path.exists():
            print(f"[INFO] Loading {raw_path}")
            df = pd.read_csv(raw_path)
            rows = []
            for _, r in df.iterrows():
                calories = self._parse_nutrition_calories(r.get("nutrition"))
                minutes  = r.get("minutes")
                # Cap cook time at 24 hrs, treat 0 as None
                if pd.notna(minutes) and 0 < minutes <= 1440:
                    cook_time = int(minutes)
                else:
                    cook_time = None
                ingredients = self._parse_python_list(r.get("ingredients", "[]"))
                rows.append({
                    "id":          id_counter,
                    "name":        r.get("name", "Unknown"),
                    "cuisine":     "unknown",
                    "ingredients": ", ".join(ingredients),
                    "cook_time":   cook_time,
                    "calories":    calories,
                    "rating":      None,
                    "img_src":     None,
                    "directions":  None,
                    "tags":        str(r.get("tags", "")),
                    "source":      "raw_recipes",
                })
                id_counter += 1
            frames.append(pd.DataFrame(rows))
            print(f"  -> {len(rows)} recipes")

        # --- recipes.csv (Allrecipes) ---
        csv_path = DATA_DIR / "recipes.csv"
        if csv_path.exists():
            print(f"[INFO] Loading {csv_path}")
            df = pd.read_csv(csv_path)
            rows = []
            for _, r in df.iterrows():
                rows.append({
                    "id":          id_counter,
                    "name":        r.get("recipe_name", "Unknown"),
                    "cuisine":     self._parse_cuisine_path(r.get("cuisine_path")),
                    "ingredients": self._clean_ingredient_string(r.get("ingredients", "")),
                    "cook_time":   self._parse_minutes(r.get("cook_time")),
                    "calories":    None,
                    "rating":      r.get("rating"),
                    "img_src":     r.get("img_src"),
                    "directions":  r.get("directions"),
                    "tags":        self._parse_cuisine_path(r.get("cuisine_path")),
                    "source":      "recipes_csv",
                })
                id_counter += 1
            frames.append(pd.DataFrame(rows))
            print(f"  -> {len(rows)} recipes")

        # --- test_recipes.csv ---
        test_csv_path = DATA_DIR / "test_recipes.csv"
        if test_csv_path.exists():
            print(f"[INFO] Loading {test_csv_path}")
            df = pd.read_csv(test_csv_path)
            rows = []
            for _, r in df.iterrows():
                ing_names = self._parse_structured_ingredients(r.get("Ingredients", "[]"))
                rows.append({
                    "id":          id_counter,
                    "name":        r.get("Name", "Unknown"),
                    "cuisine":     "unknown",
                    "ingredients": ", ".join(ing_names),
                    "cook_time":   self._parse_minutes(r.get("Cook Time")),
                    "calories":    None,
                    "rating":      None,
                    "img_src":     None,
                    "directions":  str(r.get("Directions", "")),
                    "tags":        "",
                    "source":      "test_recipes_csv",
                })
                id_counter += 1
            frames.append(pd.DataFrame(rows))
            print(f"  -> {len(rows)} recipes")

        # --- train.json ---
        train_json = DATA_DIR / "train.json"
        if train_json.exists():
            print(f"[INFO] Loading {train_json}")
            with open(train_json) as f:
                raw = json.load(f)
            rows = []
            for r in raw:
                cuisine = r.get("cuisine", "unknown")
                rows.append({
                    "id":          id_counter,
                    "name":        f"Recipe #{r['id']} ({cuisine.replace('_', ' ').title()})",
                    "cuisine":     cuisine,
                    "ingredients": ", ".join(r["ingredients"]),
                    "cook_time":   None,
                    "calories":    None,
                    "rating":      None,
                    "img_src":     None,
                    "directions":  None,
                    "tags":        cuisine,
                    "source":      "train_json",
                })
                id_counter += 1
            frames.append(pd.DataFrame(rows))
            print(f"  -> {len(rows)} recipes")

        # --- test.json ---
        test_json = DATA_DIR / "test.json"
        if test_json.exists():
            print(f"[INFO] Loading {test_json}")
            with open(test_json) as f:
                raw = json.load(f)
            rows = []
            for r in raw:
                rows.append({
                    "id":          id_counter,
                    "name":        f"Recipe #{r['id']}",
                    "cuisine":     "unknown",
                    "ingredients": ", ".join(r["ingredients"]),
                    "cook_time":   None,
                    "calories":    None,
                    "rating":      None,
                    "img_src":     None,
                    "directions":  None,
                    "tags":        "",
                    "source":      "test_json",
                })
                id_counter += 1
            frames.append(pd.DataFrame(rows))
            print(f"  -> {len(rows)} recipes")

        if not frames:
            print("[WARNING] No dataset files found in data/")
            self.df = pd.DataFrame(
                columns=["id", "name", "cuisine", "ingredients", "cook_time",
                         "calories", "rating", "img_src", "directions", "tags", "source"]
            )
            return

        self.df = pd.concat(frames, ignore_index=True)
        ingredient_docs = self.df["ingredients"].fillna("").tolist()
        self.tfidf_matrix = self.vectorizer.fit_transform(ingredient_docs)
        self._build_co_occurrence(ingredient_docs)
        print(f"[INFO] Total: {len(self.df)} recipes, "
              f"{len(self.ingredient_counts)} unique ingredients.")

    # ------------------------------------------------------------------
    # Parsers
    # ------------------------------------------------------------------

    def _parse_nutrition_calories(self, s):
        """
        nutrition field is a Python list string:
        '[51.5, 0.0, 13.0, 0.0, 2.0, 0.0, 4.0]'
        Index 0 is calories (in daily-value percent, not kcal — but consistent).
        """
        try:
            vals = ast.literal_eval(str(s))
            return float(vals[0]) if vals else None
        except Exception:
            return None

    def _parse_python_list(self, s):
        """Parse a Python list string like \"['garlic', 'butter']\" -> ['garlic', 'butter']"""
        try:
            return ast.literal_eval(str(s))
        except Exception:
            return [str(s)]

    def _parse_minutes(self, s):
        """Parse '1 hrs', '30 mins', '1 hrs 30 mins' -> int minutes."""
        if s is None or (isinstance(s, float) and pd.isna(s)):
            return None
        hrs  = re.search(r'(\d+)\s*hr', str(s))
        mins = re.search(r'(\d+)\s*min', str(s))
        total = (int(hrs.group(1)) * 60 if hrs else 0) + (int(mins.group(1)) if mins else 0)
        return total if total > 0 else None

    def _parse_cuisine_path(self, s):
        """/Desserts/Fruit Desserts/... -> 'desserts'"""
        if s is None or (isinstance(s, float) and pd.isna(s)):
            return "unknown"
        parts = [p for p in str(s).strip("/").split("/") if p]
        return parts[0].lower().replace(" ", "_") if parts else "unknown"

    def _clean_ingredient_string(self, s):
        """Strip quantities/units from free-text ingredient strings."""
        s = re.sub(r'[\d\u00bd\u00bc\u00be\u2153\u2154\u215b\u215c\u215d\u215e]+\s*', '', str(s))
        units = (r'tablespoons?|teaspoons?|cups?|pounds?|ounces?|oz|lbs?|'
                 r'cans?|jars?|bags?|boxes?|pkgs?|packages?|cloves?|'
                 r'bunches?|heads?|stalks?|slices?|pieces?|pinch|dash|'
                 r'tbsp|tsp|ml|liters?|grams?|kg')
        s = re.sub(rf'\b({units})\b', '', s, flags=re.I)
        return re.sub(r'\s+', ' ', s).strip()

    def _parse_structured_ingredients(self, s):
        """Parse test_recipes.csv JSON ingredient objects -> name list."""
        try:
            items = ast.literal_eval(str(s))
            return [i["name"].strip() for i in items if i.get("name")]
        except Exception:
            return [str(s)] if s else []

    # ------------------------------------------------------------------
    # Co-occurrence + conditional probability
    # ------------------------------------------------------------------

    def _build_co_occurrence(self, ingredient_docs):
        for doc in ingredient_docs:
            items = list({i.strip().lower() for i in doc.split(",") if i.strip()})
            for ing in items:
                self.ingredient_counts[ing] += 1
            for i, ing_a in enumerate(items):
                for ing_b in items[i + 1:]:
                    self.co_occurrence[ing_a][ing_b] += 1
                    self.co_occurrence[ing_b][ing_a] += 1

    def _conditional_probability(self, ing_a, ing_b):
        """P(B | A) = count(A and B) / count(A)"""
        count_a = self.ingredient_counts.get(ing_a, 0)
        if count_a == 0:
            return 0.0
        return self.co_occurrence[ing_a].get(ing_b, 0) / count_a

    def _aggregate_conditional_scores(self, ingredients):
        """score(B) = sum of P(B | A) for all A in input ingredients"""
        input_set = {i.strip().lower() for i in ingredients}
        scores = defaultdict(float)
        for ing_a in input_set:
            for ing_b in self.co_occurrence.get(ing_a, {}):
                if ing_b not in input_set:
                    scores[ing_b] += self._conditional_probability(ing_a, ing_b)
        return scores

    def _compute_cond_prob_recipe_boost(self, ingredients):
        """Mean P(recipe_ing | user_ing) over non-overlapping ingredient pairs."""
        if self.df is None or self.df.empty:
            return np.array([])
        input_set = {i.strip().lower() for i in ingredients}
        boosts = []
        for _, row in self.df.iterrows():
            recipe_ings = {i.strip().lower() for i in row["ingredients"].split(",") if i.strip()}
            candidate_ings = recipe_ings - input_set
            if not candidate_ings:
                boosts.append(0.0)
                continue
            total, count = 0.0, 0
            for ing_b in candidate_ings:
                for ing_a in input_set:
                    total += self._conditional_probability(ing_a, ing_b)
                    count += 1
            boosts.append(total / count if count > 0 else 0.0)
        return np.array(boosts)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def recommend(
        self,
        ingredients,
        max_cook_time=None,
        max_calories=None,
        cuisine=None,
        top_n=10,
        tfidf_weight=0.7,
        cond_prob_weight=0.3,
        rich_only=False,
    ):
        """
        Rank recipes using:
          Final score = 0.7 * TF-IDF cosine similarity + 0.3 * conditional probability boost
        Both normalised to [0,1] before combining.
        """
        if self.df is None or self.df.empty or self.tfidf_matrix is None:
            return []

        query = ", ".join(ingredients)
        query_vec = self.vectorizer.transform([query])
        tfidf_scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        cond_prob_scores = self._compute_cond_prob_recipe_boost(ingredients)

        def normalize(arr):
            rng = arr.max() - arr.min()
            return (arr - arr.min()) / rng if rng > 0 else np.zeros_like(arr)

        tfidf_norm = normalize(tfidf_scores)
        cond_norm  = normalize(cond_prob_scores) if len(cond_prob_scores) > 0 \
                     else np.zeros_like(tfidf_norm)
        combined = tfidf_weight * tfidf_norm + cond_prob_weight * cond_norm

        results = self.df.copy()
        results["tfidf_score"]     = np.round(tfidf_scores, 4)
        results["cond_prob_score"] = np.round(cond_prob_scores, 4)
        results["score"]           = np.round(combined, 4)

        if rich_only:
            results = results[results["source"].isin(
                ["raw_recipes", "recipes_csv", "test_recipes_csv"]
            )]
        if cuisine:
            results = results[results["cuisine"].str.lower() == cuisine.lower()]
        if max_cook_time is not None:
            results = results[
                results["cook_time"].isna() | (results["cook_time"] <= max_cook_time)
            ]
        if max_calories is not None:
            results = results[
                results["calories"].isna() | (results["calories"] <= max_calories)
            ]

        results = results.sort_values("score", ascending=False).head(top_n)
        records = results[[
            "id", "name", "cuisine", "ingredients", "calories", "cook_time",
            "rating", "img_src", "score", "tfidf_score", "cond_prob_score", "source"
        ]].to_dict(orient="records")
        return self._clean_records(records)
        
    

    def _clean_records(self, records):
        """
        Recursively convert numpy types and NaN/inf values to JSON-safe
        Python types. numpy.float64 NaN is a subclass of float so Python's
        json encoder hits it directly before calling any default= handler —
        this manual traversal is the only reliable fix.
        """
        def clean(val):
            if isinstance(val, dict):
                return {k: clean(v) for k, v in val.items()}
            if isinstance(val, list):
                return [clean(v) for v in val]
            if isinstance(val, np.integer):
                return int(val)
            if isinstance(val, np.floating):
                if np.isnan(val) or np.isinf(val):
                    return None
                return float(val)
            if isinstance(val, float):
                if val != val or val == float("inf") or val == float("-inf"):
                    return None
                return val
            return val
        return [clean(r) for r in records]

    def suggest_ingredients(self, ingredients, top_n=5):
        """Suggest complementary ingredients ranked by aggregated conditional probability."""
        scores = self._aggregate_conditional_scores(ingredients)
        sorted_suggestions = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [
            {"ingredient": s[0], "probability": round(s[1], 4)}
            for s in sorted_suggestions[:top_n]
        ]

    def available_cuisines(self):
        if self.df is None or "cuisine" not in self.df.columns:
            return []
        return sorted(self.df["cuisine"].dropna().unique().tolist())