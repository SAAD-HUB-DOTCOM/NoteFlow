"""NoteFlow FastAPI backend entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as api_router
from app.config import get_settings
from app.webhooks import router as webhook_router

settings = get_settings()

app = FastAPI(title="NoteFlow API", version="0.1.0")

# Strict CORS: allow only the configured frontend origin(s). FRONTEND_URL may be a
# comma-separated list (e.g. local dev + the deployed Vercel domain).
_allowed_origins = [o.strip() for o in settings.frontend_url.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(webhook_router)  # /webhooks/recall — Recall-signature-verified, no JWT


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "NoteFlow API", "docs": "/docs", "health": "/api/v1/health"}
