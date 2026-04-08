from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import recommend

app = FastAPI(title="Intelligent Recipe Recommendation System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommend.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Recipe Recommendation API is running"}