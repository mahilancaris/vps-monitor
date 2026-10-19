from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.models import AuditLog
from app.schemas.schemas import AuditLogResponse
from app.api.deps import get_current_admin

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
async def list_audit_logs(
    action: Optional[str] = None,
    limit: int = Query(50, le=200),
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(AuditLog).options(selectinload(AuditLog.user))
    if action:
        query = query.where(AuditLog.action == action)
    query = query.order_by(AuditLog.created_at.desc()).limit(limit)

    res = await db.execute(query)
    logs = res.scalars().all()

    resp = []
    for l in logs:
        item = AuditLogResponse.model_validate(l)
        if l.user:
            item.username = l.user.username
        resp.append(item)
    return resp
