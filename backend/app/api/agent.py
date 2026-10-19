import os
from datetime import datetime
from fastapi import APIRouter, Depends, Request, status, HTTPException
from fastapi.responses import PlainTextResponse, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.models import (
    Server, ServerStatus, Heartbeat, Metric, DiskMetric,
    NetworkMetric, ListeningPort, Alert, AlertStatus
)
from app.schemas.schemas import AgentHeartbeatPayload, AgentMetricsPayload
from app.api.deps import get_current_agent_server
from app.services.evaluator import check_metric_thresholds
from app.services.ws_manager import ws_manager

router = APIRouter(prefix="/agent", tags=["Agent Ingestion"])

# Resolve agent scripts path
AGENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "agent"))

@router.get("/install.sh", response_class=PlainTextResponse)
async def get_install_script():
    path = os.path.join(AGENT_DIR, "install-agent.sh")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="install-agent.sh not found")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

@router.get("/fleet_agent.py", response_class=PlainTextResponse)
async def get_agent_python_script():
    path = os.path.join(AGENT_DIR, "fleet_agent.py")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="fleet_agent.py not found")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

@router.get("/fleet-agent.service", response_class=PlainTextResponse)
async def get_agent_service_unit():
    path = os.path.join(AGENT_DIR, "fleet-agent.service")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="fleet-agent.service not found")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

@router.post("/heartbeat", status_code=status.HTTP_200_OK)
async def ingest_heartbeat(
    payload: AgentHeartbeatPayload,
    request: Request,
    agent_info=Depends(get_current_agent_server),
    db: AsyncSession = Depends(get_db)
):
    server, credential = agent_info
    client_ip = request.client.host if request.client else None

    now = datetime.utcnow()
    server.last_heartbeat = now
    previous_status = server.status
    server.status = ServerStatus.ONLINE.value

    if payload.os_info and not server.os_info:
        server.os_info = payload.os_info
    if payload.hostname and not server.hostname:
        server.hostname = payload.hostname

    # Record heartbeat event
    hb = Heartbeat(
        server_id=server.id,
        timestamp=now,
        agent_version=payload.agent_version,
        source_ip=client_ip
    )
    db.add(hb)

    # If recovered from offline/delayed, resolve active offline alerts
    if previous_status in (ServerStatus.OFFLINE.value, ServerStatus.DELAYED.value):
        alert_stmt = select(Alert).where(
            Alert.server_id == server.id,
            Alert.alert_type.in_(["server_offline", "server_delayed"]),
            Alert.status == AlertStatus.ACTIVE.value
        )
        res = await db.execute(alert_stmt)
        for alert in res.scalars().all():
            alert.status = AlertStatus.RESOLVED.value
            alert.resolved_at = now

    await db.commit()

    if previous_status != ServerStatus.ONLINE.value:
        await ws_manager.broadcast({
            "event": "server_status_changed",
            "server_id": server.id,
            "server_name": server.name,
            "old_status": previous_status,
            "new_status": ServerStatus.ONLINE.value
        })

    return {"status": "ok", "server_id": server.id, "server_name": server.name, "timestamp": now.isoformat()}

@router.post("/metrics", status_code=status.HTTP_201_CREATED)
async def ingest_metrics(
    payload: AgentMetricsPayload,
    request: Request,
    agent_info=Depends(get_current_agent_server),
    db: AsyncSession = Depends(get_db)
):
    server, credential = agent_info
    now = datetime.utcnow()
    server.last_heartbeat = now
    server.status = ServerStatus.ONLINE.value

    # Update server spec cache
    if payload.os_info:
        server.os_info = payload.os_info
    if payload.hostname:
        server.hostname = payload.hostname
    if payload.cpu_model:
        server.cpu_model = payload.cpu_model
    if payload.cpu_cores:
        server.cpu_cores = payload.cpu_cores
    if payload.ram_total_mb:
        server.ram_total_mb = payload.ram_total_mb
    if payload.disk_total_gb:
        server.disk_total_gb = payload.disk_total_gb

    # Save central metric record
    metric = Metric(
        server_id=server.id,
        timestamp=now,
        cpu_percent=payload.cpu_percent,
        load_1=payload.load_1,
        load_5=payload.load_5,
        load_15=payload.load_15,
        ram_used_mb=payload.ram_used_mb,
        ram_percent=payload.ram_percent,
        swap_used_mb=payload.swap_used_mb,
        swap_percent=payload.swap_percent,
        uptime_seconds=payload.uptime_seconds,
        temperature_c=payload.temperature_c,
        battery_percent=payload.battery_percent,
        battery_charging=payload.battery_charging
    )
    db.add(metric)
    await db.flush() # Populate metric.id

    # Add disk partitions
    for d in payload.disks:
        db.add(DiskMetric(
            metric_id=metric.id,
            server_id=server.id,
            mount_point=d.mount_point,
            filesystem=d.filesystem,
            total_gb=d.total_gb,
            used_gb=d.used_gb,
            percent_used=d.percent_used,
            timestamp=now
        ))

    # Add network interfaces
    for n in payload.networks:
        db.add(NetworkMetric(
            metric_id=metric.id,
            server_id=server.id,
            interface=n.interface,
            bytes_sent=n.bytes_sent,
            bytes_recv=n.bytes_recv,
            tx_sec=n.tx_sec,
            rx_sec=n.rx_sec,
            timestamp=now
        ))

    # Update Listening Ports inventory
    if payload.ports:
        # Delete prior inventory for this server to keep it clean and current
        del_stmt = select(ListeningPort).where(ListeningPort.server_id == server.id)
        existing_ports = (await db.execute(del_stmt)).scalars().all()
        for ep in existing_ports:
            await db.delete(ep)

        for p in payload.ports:
            # Determine if wildcard or public
            is_wild = p.address in ("0.0.0.0", "::", "*")
            is_pub = not (p.address.startswith("127.") or p.address == "::1" or p.address == "localhost")
            db.add(ListeningPort(
                server_id=server.id,
                port=p.port,
                protocol=p.protocol.lower(),
                address=p.address,
                process_name=p.process_name or "unknown",
                pid=p.pid,
                is_wildcard=is_wild,
                is_public_facing=is_pub,
                last_seen=now
            ))

    # Evaluate metric alert thresholds (CPU, RAM, Disks)
    await check_metric_thresholds(db, server, payload.cpu_percent, payload.ram_percent, payload.disks)

    await db.commit()

    # Broadcast live metric to connected dashboard clients
    await ws_manager.broadcast({
        "event": "metric_received",
        "server_id": server.id,
        "timestamp": now.isoformat(),
        "cpu_percent": payload.cpu_percent,
        "ram_percent": payload.ram_percent,
        "uptime_seconds": payload.uptime_seconds,
        "disks_count": len(payload.disks)
    })

    return {"status": "recorded", "metric_id": metric.id}
