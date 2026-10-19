import os
import psutil
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/system", tags=["System & Backend Health"])

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    db_ok = False
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    proc = psutil.Process(os.getpid())
    mem_info = proc.memory_info()

    return {
        "status": "healthy" if db_ok else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_connected": db_ok,
        "environment": settings.ENVIRONMENT,
        "backend_process": {
            "memory_rss_mb": round(mem_info.rss / 1024 / 1024, 2),
            "cpu_percent": proc.cpu_percent(interval=None)
        }
    }
