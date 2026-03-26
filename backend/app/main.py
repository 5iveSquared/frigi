from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.session import engine
from app.db.redis import get_redis_pool
from app.routers import health, players, levels, sessions, scores


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.redis = await get_redis_pool()
    yield
    # Shutdown
    await app.state.redis.aclose()
    await engine.dispose()


app = FastAPI(
    title="Frigi API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(players.router, prefix="/players", tags=["players"])
app.include_router(levels.router, prefix="/levels", tags=["levels"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(scores.router, prefix="/scores", tags=["scores"])
