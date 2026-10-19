import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.models import Alert, Server, NotificationSetting, AlertStatus, AuditLog
from app.schemas.schemas import (
    AlertResponse, AlertAcknowledgeRequest,
    NotificationSettingResponse, NotificationSettingUpdate
)
from app.api.deps import get_current_user, get_current_admin
from app.services.ws_manager import ws_manager

router = APIRouter(prefix="/alerts", tags=["Alerts Management"])

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    status_filter: Optional[str] = Query(None, pattern="^(active|acknowledged|resolved)$"),
    server_id: Optional[int] = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Alert).options(selectinload(Alert.server))
    if status_filter:
        query = query.where(Alert.status == status_filter)
    if server_id:
        query = query.where(Alert.server_id == server_id)

    query = query.order_by(Alert.triggered_at.desc()).limit(100)
    result = await db.execute(query)
    alerts = result.scalars().all()

    response_list = []
    for a in alerts:
        resp = AlertResponse.model_validate(a)
        if a.server:
            resp.server_name = a.server.name
            resp.server_location = a.server.location
        response_list.append(resp)
    return response_list

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    req: AlertAcknowledgeRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Alert).where(Alert.id == alert_id)
    res = await db.execute(stmt)
    alert = res.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    now = datetime.utcnow()
    if req.resolved:
        alert.status = AlertStatus.RESOLVED.value
        alert.resolved_at = now
    else:
        alert.status = AlertStatus.ACKNOWLEDGED.value
        alert.acknowledged_at = now
        alert.acknowledged_by_user_id = user.id

    db.add(AuditLog(
        user_id=user.id,
        action="resolve_alert" if req.resolved else "acknowledge_alert",
        target_type="alert",
        target_id=str(alert.id),
        details=f"User {user.username} {'resolved' if req.resolved else 'acknowledged'} alert: {alert.title}"
    ))
    await db.commit()

    await ws_manager.broadcast({
        "event": "alert_updated",
        "alert_id": alert.id,
        "status": alert.status
    })

    return {"status": "success", "alert_status": alert.status}

@router.get("/notifications", response_model=List[NotificationSettingResponse])
async def list_notifications(admin=Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    stmt = select(NotificationSetting).order_by(NotificationSetting.id.asc())
    res = await db.execute(stmt)
    settings_list = res.scalars().all()
    return [NotificationSettingResponse.model_validate(s) for s in settings_list]

@router.put("/notifications/{channel}", response_model=NotificationSettingResponse)
async def update_notification_channel(
    channel: str,
    update_in: NotificationSettingUpdate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(NotificationSetting).where(NotificationSetting.channel == channel)
    res = await db.execute(stmt)
    setting = res.scalar_one_or_none()
    if not setting:
        setting = NotificationSetting(channel=channel)
        db.add(setting)

    setting.is_enabled = update_in.is_enabled
    setting.min_severity = update_in.min_severity
    setting.config_json = json.dumps(update_in.config)
    await db.commit()
    await db.refresh(setting)

    return NotificationSettingResponse.model_validate(setting)
