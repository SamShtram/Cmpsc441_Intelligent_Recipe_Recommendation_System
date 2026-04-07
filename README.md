# Intelligent Recipe Recommendation System
**CMPSC 441 — Jack Demtshuk, Rebecca Nanayakkara, Samuel Shtrambrand**

Recommends recipes based on ingredients you have using **TF-IDF vectorization** and an **ingredient co-occurrence matrix**.

---

## Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── routers/
│   │   └── recommend.py         # /api/recommend and /api/suggest-ingredients
│   └── services/
│       └── recommender.py       # TF-IDF engine + co-occurrence matrix
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── SearchForm.jsx
│           ├── RecipeList.jsx
│           └── IngredientSuggestions.jsx
├── data/
│   └── recipes.csv              # Recipe dataset (name, ingredients, calories, cook_time, tags)
└── config_files/
    └── config.yaml              # App-wide configuration
```

---

## Getting Started

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### Frontend
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
| POST | `/api/recommend` | Get recipe recommendations |
| GET | `/api/suggest-ingredients` | Get complementary ingredient suggestions |

### POST `/api/recommend` — Request Body
```json
{
  "ingredients": ["chicken", "garlic", "lemon"],
  "max_calories": 600,
  "max_cook_time": 30,
  "dietary_restrictions": ["gluten-free"]
}
```

---

## Data Format

`data/recipes.csv` expects these columns:

| Column | Type | Example |
|--------|------|---------|
| `name` | string | Garlic Lemon Chicken |
| `ingredients` | comma-separated string | chicken, garlic, lemon |
| `calories` | integer | 350 |
| `cook_time` | integer (minutes) | 30 |
| `tags` | space-separated string | gluten-free dairy-free |

---

## How It Works

1. **TF-IDF Vectorization** — Each recipe's ingredient list is converted to a TF-IDF vector. The user's input ingredients are vectorized the same way.
2. **Cosine Similarity** — Recipes are ranked by similarity to the user's ingredient vector.
3. **Filters** — Results are filtered by calorie cap, cook time, and dietary tags.
4. **Co-occurrence Matrix** — Ingredient pairs that appear together frequently across recipes are used to suggest complementary ingredients.
