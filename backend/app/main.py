import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base
from app.api.auth import router as auth_router
from app.api.servers import router as servers_router
from app.api.agent import router as agent_router
from app.api.metrics import router as metrics_router
from app.api.ports import router as ports_router
from app.api.alerts import router as alerts_router
from app.api.audit import router as audit_router
from app.api.system import router as system_router
from app.api.ws import router as ws_router
from app.services.evaluator import run_evaluator_loop

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("fleet.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist in dev/sqlite
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schemas verified.")

    # Start background heartbeat & threshold evaluator task
    evaluator_task = asyncio.create_task(run_evaluator_loop())
    logger.info("Fleet heartbeat evaluator loop started.")

    yield

    # Shutdown
    evaluator_task.cancel()
    try:
        await evaluator_task
    except asyncio.CancelledError:
        pass
    logger.info("Fleet evaluator loop stopped.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Mobile-First Multi-Server Monitoring Platform for Ubuntu VPS and Home Servers",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(servers_router, prefix="/api")
app.include_router(agent_router, prefix="/api")
app.include_router(metrics_router, prefix="/api")
app.include_router(ports_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(system_router, prefix="/api")
app.include_router(ws_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": "/docs"
    }
