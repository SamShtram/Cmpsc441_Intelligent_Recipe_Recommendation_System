# Intelligent Recipe Recommendation System
**CMPSC 441 — Jack Demtshuk, Rebecca Nanayakkara, Samuel Shtrambrand**

Recommends recipes based on ingredients you have using **TF-IDF vectorization** and **conditional probability** over an ingredient co-occurrence matrix.

---

## Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── routers/
│   │   └── recommend.py         # /api/recommend, /api/suggest-ingredients, /api/cuisines
│   └── services/
│       └── recommender.py       # TF-IDF engine + conditional probability
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── SearchForm.jsx
│           ├── RecipeList.jsx
│           └── IngredientSuggestions.jsx
├── data/
│   ├── recipes.csv              # 1 090 Allrecipes recipes (name, cook time, rating, image)
│   ├── test_recipes.csv         # 59 recipes with structured ingredient objects
│   ├── train.json               # 39 774 Kaggle "What's Cooking" recipes (cuisine + ingredients)
│   └── test.json                # 9 944 Kaggle recipes (ingredients only)
├── config_files/
│   └── config.yaml              # App-wide configuration
├── venv/                        # Python virtual environment (not committed)
└── requirements.txt             # Python dependencies
```

---

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/SamShtram/Cmpsc441_Intelligent_Recipe_Recommendation_System.git
cd Cmpsc441_Intelligent_Recipe_Recommendation_System
```

### 2. Set up the Python virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

> **Every time you open a new terminal**, reactivate the venv first:
> ```bash
> source venv/bin/activate
> ```

### 3. Run the backend
```bash
cd backend
uvicorn main:app --reload
```
API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 4. Run the frontend (separate terminal)
```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:3000`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recommend` | Get ranked recipe recommendations |
| GET | `/api/suggest-ingredients` | Get complementary ingredient suggestions |
| GET | `/api/cuisines` | List all available cuisine labels |

### POST `/api/recommend` — Request Body
```json
{
  "ingredients": ["chicken", "garlic", "onion"],
  "cuisine": "italian",
  "max_cook_time": 45
}
```

### GET `/api/suggest-ingredients`
```
/api/suggest-ingredients?ingredients=garlic,olive oil,tomato
```

---

## Datasets

The recommender automatically loads all dataset files found in `data/` and merges them.

| File | Recipes | What it provides |
|------|---------|-----------------|
| `recipes.csv` | 1 090 | Names, cook times, ratings, images, directions |
| `test_recipes.csv` | 59 | Names, cook times, structured ingredients |
| `train.json` | 39 774 | Cuisine labels + clean ingredient lists |
| `test.json` | 9 944 | Ingredient lists only |

The large JSON datasets primarily strengthen the co-occurrence matrix used for conditional probability scoring and ingredient suggestions.

---

## How It Works

1. **TF-IDF Vectorization** — Each recipe's ingredient list is converted to a TF-IDF vector. TF measures how often an ingredient appears in a specific recipe; IDF down-weights ingredients that appear across almost all recipes (e.g. salt, water).

2. **Cosine Similarity** — The user's input ingredients are vectorized the same way, then compared against every recipe to produce a similarity score.

3. **Conditional Probability Boost** — An ingredient co-occurrence matrix is built from all 50 000+ recipes. For each recipe, we compute:

   > **P(B | A) = count(A and B) / count(A)**

   and aggregate across the user's full ingredient set:

   > **score(B) = Σ P(B | A) for all A in input**

   Recipes whose non-overlapping ingredients are strongly predicted by the user's inputs receive a higher boost.

4. **Combined Score** — Final ranking uses a weighted combination:

   > **score = 0.7 × TF-IDF similarity + 0.3 × conditional probability boost**

5. **Ingredient Suggestions** — The same conditional probability aggregation is used to suggest complementary ingredients the user might want to add.
