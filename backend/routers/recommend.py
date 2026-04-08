from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.recommender import RecipeRecommender

router = APIRouter()
recommender = RecipeRecommender()


class RecommendRequest(BaseModel):
    ingredients: List[str]
    cuisine: Optional[str] = None
    max_cook_time: Optional[int] = None
    max_calories: Optional[float] = None
    dietary_restrictions: Optional[List[str]] = []


@router.post("/recommend")
def recommend_recipes(request: RecommendRequest):
    results = recommender.recommend(
        ingredients=request.ingredients,
        cuisine=request.cuisine,
        max_cook_time=request.max_cook_time,
        max_calories=request.max_calories,
    )
    return {"recipes": results}


@router.get("/suggest-ingredients")
def suggest_ingredients(ingredients: str):
    ingredient_list = [i.strip() for i in ingredients.split(",")]
    suggestions = recommender.suggest_ingredients(ingredient_list)
    return {"suggestions": suggestions}


@router.get("/cuisines")
def get_cuisines():
    return {"cuisines": recommender.available_cuisines()}