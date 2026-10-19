import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.config import settings
from app.models.models import Server, ServerStatus, Alert, AlertSeverity, AlertStatus
from app.services.ws_manager import ws_manager
from app.services.notifier import dispatch_alert_notifications

logger = logging.getLogger("fleet.evaluator")

async def evaluate_server_statuses():
    """
    Periodically checks heartbeat age of all active servers.
    Transitions status to 'delayed' or 'offline' when thresholds are breached,
    triggers alerts, and broadcasts updates via WebSockets.
    """
    async with AsyncSessionLocal() as db:
        try:
            stmt = select(Server).where(Server.is_active == True)
            result = await db.execute(stmt)
            servers = result.scalars().all()

            now = datetime.utcnow()
            delayed_delta = timedelta(seconds=settings.SERVER_DELAYED_THRESHOLD_SECONDS)
            offline_delta = timedelta(seconds=settings.SERVER_OFFLINE_THRESHOLD_SECONDS)

            for server in servers:
                # If never had a heartbeat yet
                if not server.last_heartbeat:
                    if server.status != ServerStatus.OFFLINE.value:
                        server.status = ServerStatus.OFFLINE.value
                        await db.commit()
                    continue

                age = now - server.last_heartbeat
                old_status = server.status
                new_status = old_status

                if age > offline_delta:
                    new_status = ServerStatus.OFFLINE.value
                elif age > delayed_delta:
                    new_status = ServerStatus.DELAYED.value
                else:
                    new_status = ServerStatus.ONLINE.value

                if new_status != old_status:
                    server.status = new_status
                    logger.warning(f"Server '{server.name}' status changed: {old_status} -> {new_status}")

                    # Generate Alert if server went offline or delayed
                    if new_status in (ServerStatus.OFFLINE.value, ServerStatus.DELAYED.value):
                        severity = AlertSeverity.CRITICAL.value if new_status == ServerStatus.OFFLINE.value else AlertSeverity.WARNING.value
                        alert_type = f"server_{new_status}"
                        title = f"Server {new_status.capitalize()}: {server.name}"
                        message = f"Server '{server.name}' in '{server.location}' missed heartbeats. Last seen {int(age.total_seconds())}s ago."

                        # Check if active alert already exists
                        existing_stmt = select(Alert).where(
                            and_(
                                Alert.server_id == server.id,
                                Alert.alert_type == alert_type,
                                Alert.status == AlertStatus.ACTIVE.value
                            )
                        )
                        existing_res = await db.execute(existing_stmt)
                        if not existing_res.scalar_one_or_none():
                            new_alert = Alert(
                                server_id=server.id,
                                alert_type=alert_type,
                                severity=severity,
                                title=title,
                                message=message,
                                status=AlertStatus.ACTIVE.value
                            )
                            db.add(new_alert)
                            await dispatch_alert_notifications(title, message, severity, server.name)

                    # Auto-resolve offline/delayed alerts if recovered to online
                    elif new_status == ServerStatus.ONLINE.value:
                        resolve_stmt = select(Alert).where(
                            and_(
                                Alert.server_id == server.id,
                                Alert.alert_type.in_(["server_offline", "server_delayed"]),
                                Alert.status == AlertStatus.ACTIVE.value
                            )
                        )
                        res = await db.execute(resolve_stmt)
                        active_offline_alerts = res.scalars().all()
                        for a in active_offline_alerts:
                            a.status = AlertStatus.RESOLVED.value
                            a.resolved_at = datetime.utcnow()

                    await db.commit()

                    # Broadcast change over WebSocket
                    await ws_manager.broadcast({
                        "event": "server_status_changed",
                        "server_id": server.id,
                        "server_name": server.name,
                        "old_status": old_status,
                        "new_status": new_status,
                        "last_heartbeat": server.last_heartbeat.isoformat() if server.last_heartbeat else None
                    })

        except Exception as e:
            logger.error(f"Error in evaluate_server_statuses: {e}", exc_info=True)

async def check_metric_thresholds(db: AsyncSession, server: Server, cpu_percent: float, ram_percent: float, disks: list):
    """Evaluate metric values and trigger warnings if thresholds are exceeded"""
    # CPU Alert (> 90%)
    if cpu_percent >= 90.0:
        await _ensure_active_alert(
            db, server.id, "high_cpu", AlertSeverity.WARNING.value,
            f"High CPU Usage ({cpu_percent:.1f}%) on {server.name}",
            f"CPU utilization sustained at {cpu_percent:.1f}% on {server.name} ({server.location})."
        )
    else:
        await _auto_resolve_alert(db, server.id, "high_cpu")

    # RAM Alert (> 95%)
    if ram_percent >= 95.0:
        await _ensure_active_alert(
            db, server.id, "high_ram", AlertSeverity.CRITICAL.value,
            f"High RAM Usage ({ram_percent:.1f}%) on {server.name}",
            f"Memory utilization reached {ram_percent:.1f}% on {server.name}."
        )
    else:
        await _auto_resolve_alert(db, server.id, "high_ram")

    # Disk Alerts (> 90%)
    for disk in disks:
        percent = getattr(disk, 'percent_used', 0.0) if hasattr(disk, 'percent_used') else disk.get('percent_used', 0.0)
        mount = getattr(disk, 'mount_point', '/') if hasattr(disk, 'mount_point') else disk.get('mount_point', '/')
        alert_key = f"high_disk_{mount}"
        if percent >= 90.0:
            await _ensure_active_alert(
                db, server.id, alert_key, AlertSeverity.WARNING.value,
                f"Disk Volume Nearly Full ({percent:.1f}%) on {server.name}:{mount}",
                f"Mount point '{mount}' is {percent:.1f}% full on {server.name}."
            )
        else:
            await _auto_resolve_alert(db, server.id, alert_key)

async def _ensure_active_alert(db: AsyncSession, server_id: int, alert_type: str, severity: str, title: str, message: str):
    stmt = select(Alert).where(
        and_(
            Alert.server_id == server_id,
            Alert.alert_type == alert_type,
            Alert.status == AlertStatus.ACTIVE.value
        )
    )
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        alert = Alert(
            server_id=server_id,
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            status=AlertStatus.ACTIVE.value
        )
        db.add(alert)
        await db.commit()
        await ws_manager.broadcast({
            "event": "new_alert",
            "server_id": server_id,
            "title": title,
            "severity": severity
        })

async def _auto_resolve_alert(db: AsyncSession, server_id: int, alert_type: str):
    stmt = select(Alert).where(
        and_(
            Alert.server_id == server_id,
            Alert.alert_type == alert_type,
            Alert.status == AlertStatus.ACTIVE.value
        )
    )
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()
    if alert:
        alert.status = AlertStatus.RESOLVED.value
        alert.resolved_at = datetime.utcnow()
        await db.commit()
        await ws_manager.broadcast({
            "event": "alert_resolved",
            "alert_id": alert.id,
            "server_id": server_id
        })

async def run_evaluator_loop():
    """Background task running continuously in the FastAPI application"""
    while True:
        try:
            await evaluate_server_statuses()
        except Exception as e:
            logger.error(f"Error in evaluator loop: {e}")
        await asyncio.sleep(5)
