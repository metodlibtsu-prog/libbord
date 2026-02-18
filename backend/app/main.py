from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
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
    # Startup
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
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
