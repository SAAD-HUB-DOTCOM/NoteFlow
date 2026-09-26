import asyncio
import contextlib
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

from app.api import router as api_router
from app.config import get_settings
from app.webhooks import router as webhook_router

settings = get_settings()
log = logging.getLogger("noteflow.main")


async def _sweeper_loop() -> None:
    from app.services.transcription import sweep_stuck_meetings

    await asyncio.sleep(15) 
    while True:
        try:
            await run_in_threadpool(sweep_stuck_meetings)
        except Exception:  
            
            log.exception("sweeper iteration failed")
        await asyncio.sleep(60)


@contextlib.asynccontextmanager
async def _lifespan(_: FastAPI):
    task = asyncio.create_task(_sweeper_loop())
    try:
        yield
    finally:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


app = FastAPI(title="NoteFlow API", version="0.1.0", lifespan=_lifespan)


_allowed_origins = [o.strip() for o in settings.frontend_url.split(",") if o.strip()]
_localhost_regex = r"^http://localhost:\d+$" if settings.environment == "development" else None
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=_localhost_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(webhook_router)  

@app.get("/")
def root() -> dict[str, str]:
    return {"name": "NoteFlow API", "docs": "/docs", "health": "/api/v1/health"}
