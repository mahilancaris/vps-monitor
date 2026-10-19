from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.models import ListeningPort, Server, UserRole
from app.schemas.schemas import ListeningPortSchema
from app.api.deps import get_current_user

router = APIRouter(prefix="/ports", tags=["Port Inventory"])

@router.get("/server/{server_id}", response_model=List[ListeningPortSchema])
async def get_server_ports(
    server_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ListeningPort)
        .where(ListeningPort.server_id == server_id)
        .order_by(ListeningPort.port.asc())
    )
    res = await db.execute(stmt)
    ports = res.scalars().all()

    # Redact raw internal PID/process details if user is not admin
    sanitized = []
    for p in ports:
        item = ListeningPortSchema.model_validate(p)
        if user.role != UserRole.ADMIN.value:
            # Mask PID for read-only viewer to adhere to requirement 6
            item.pid = None
        sanitized.append(item)

    return sanitized
