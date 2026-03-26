from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.auth.router import router as auth_router
from app.config import settings
from app.database import engine
import app.models  # noqa: F401 — ensures all models are registered with Base.metadata
from app.models.base import Base
from app.routers import (
    channels,
    dashboard,
    engagement_metrics,
    libraries,
    metric_counters,
    reviews,
    sync,
    vk,
    yandex_auth,
)
from app.scheduler.setup import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — ensure all tables exist (idempotent)
    async with engine.begin() as conn:
        # Create custom ENUM types before create_all (they use create_type=False)
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE sync_status_type AS ENUM ('idle','syncing','success','error');
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
            DO $$ BEGIN
                CREATE TYPE channel_type AS ENUM ('website','e_library','catalog','telegram','vk','mobile_app','other');
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
            DO $$ BEGIN
                CREATE TYPE sentiment_type AS ENUM ('positive','neutral','negative');
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        """))
        await conn.run_sync(Base.metadata.create_all)
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="Libbord API",
    description="Analytics dashboard for libraries",
    version="0.1.0",
    lifespan=lifespan,
)

_ALWAYS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://libbord.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=list({*_ALWAYS_ALLOWED_ORIGINS, *settings.cors_origins}),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(dashboard.router)
app.include_router(libraries.router)
app.include_router(channels.router)
app.include_router(metric_counters.router)
app.include_router(engagement_metrics.router)
app.include_router(reviews.router)
app.include_router(vk.router)
app.include_router(yandex_auth.router)
app.include_router(sync.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
