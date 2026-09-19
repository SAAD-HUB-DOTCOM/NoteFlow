"""NoteFlow FastAPI backend entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as api_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(title="NoteFlow API", version="0.1.0")

# Strict CORS: allow only the configured frontend origin (§25).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "NoteFlow API", "docs": "/docs", "health": "/api/v1/health"}
