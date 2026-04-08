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
│       └── recommender.py       # TF-IDF engine + conditional probability scorer
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       ├── App.jsx
│       └── components/
│           ├── SearchForm.jsx
│           ├── RecipeList.jsx
│           └── IngredientSuggestions.jsx
├── data/
│   ├── recipes.csv              # 1 090 Allrecipes recipes (name, cook time, rating, image)
│   ├── test_recipes.csv         # 59 recipes with structured ingredient objects
│   ├── train.json               # 39 774 Kaggle "What's Cooking" recipes (cuisine + ingredients)
│   ├── test.json                # 9 944 Kaggle recipes (ingredients only)
│   └── RAW_recipes.csv          # ⚠️ NOT in repo — download from Kaggle (see below)
├── config_files/
│   └── config.yaml
├── venv/                        # Python virtual environment (not committed)
├── requirements.txt             # Python dependencies
└── README.md
```

---

## Large Dataset Setup ⚠️

`RAW_recipes.csv` (280MB) is not committed to this repo due to GitHub's file size limit.

**Download it from Kaggle:**
1. Go to https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions
2. Download the dataset and unzip it
3. Copy `RAW_recipes.csv` into the `data/` folder

The backend will work without it (falling back to the other datasets), but `RAW_recipes.csv` provides 231,000+ recipes with real calorie data and significantly improves recommendation quality.

---

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/SamShtram/Cmpsc441_Intelligent_Recipe_Recommendation_System.git
cd Cmpsc441_Intelligent_Recipe_Recommendation_System
```

### 2. Set up Python virtual environment
```bash
python3 -m venv venv
source venv/bin/activate      # Windows WSL / Linux / Mac
pip install -r requirements.txt
```

> **Every time you open a new terminal**, reactivate first:
> ```bash
> source venv/bin/activate
> ```

### 3. Add the large dataset (see above)
Place `RAW_recipes.csv` in the `data/` folder.

### 4. Run the backend
```bash
cd backend
uvicorn main:app --reload
```
API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 5. Run the frontend (separate terminal)
```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:5173`.

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
  "max_calories": 800,
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
| `RAW_recipes.csv` | 231 637 | Names, real calories, cook times, tags — **download required** |
| `recipes.csv` | 1 090 | Names, cook times, ratings, images, directions |
| `test_recipes.csv` | 59 | Names, cook times, structured ingredients |
| `train.json` | 39 774 | Cuisine labels + clean ingredient lists |
| `test.json` | 9 944 | Ingredient lists only |

**Total when all files present: 282,504 recipes, 20,350 unique ingredients.**

The large JSON datasets primarily strengthen the co-occurrence matrix used for conditional probability scoring and ingredient suggestions.

---

## How It Works

### 1. TF-IDF Vectorization
Each recipe's ingredient list is converted to a TF-IDF vector:
- **TF** — how often an ingredient appears in a specific recipe
- **IDF** — down-weights common ingredients (salt, water) that appear across almost all recipes

The user's input ingredients are vectorized the same way, then compared against every recipe using **cosine similarity**.

### 2. Ingredient Co-occurrence Matrix
Built from all 282k+ recipes:
```
co_occurrence[A][B] = number of recipes containing both A and B
ingredient_counts[A] = number of recipes containing A
```

### 3. Conditional Probability
For each pair of ingredients:
```
P(B | A) = count(A and B) / count(A)
```
Aggregated across the user's full ingredient set:
```
score(B) = Σ P(B | A)  for all A in user's ingredients
```
This powers both **ingredient suggestions** and a **recipe boost score**.

### 4. Combined Ranking
```
final_score = 0.7 × TF-IDF similarity + 0.3 × conditional probability boost
```
Both components are normalized to [0, 1] before combining. Results are then filtered by cuisine, max calories, and max cook time.

---

## Notes
- The `venv/` folder and `data/RAW_recipes.csv` are excluded from git via `.gitignore`
- The backend auto-detects which dataset files are present in `data/` — no config changes needed
- Calorie filtering only applies to recipes from `RAW_recipes.csv` (other datasets don't include nutrition data)
