from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.database import get_db
from app.models.models import Server, Metric, DiskMetric, NetworkMetric, Alert, AlertStatus, ServerStatus
from app.schemas.schemas import FleetSummaryResponse, MetricSchema
from app.api.deps import get_current_user

router = APIRouter(prefix="/metrics", tags=["Metrics Analytics"])

@router.get("/fleet", response_model=FleetSummaryResponse)
async def get_fleet_summary(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    servers_stmt = select(Server).where(Server.is_active == True)
    servers = (await db.execute(servers_stmt)).scalars().all()

    total = len(servers)
    online = sum(1 for s in servers if s.status == ServerStatus.ONLINE.value)
    delayed = sum(1 for s in servers if s.status == ServerStatus.DELAYED.value)
    offline = sum(1 for s in servers if s.status == ServerStatus.OFFLINE.value)

    # Calculate overall latest CPU, RAM, Disk
    total_cpu = 0.0
    total_ram_used = 0
    total_ram_cap = 0
    total_disk_used = 0.0
    total_disk_cap = 0.0
    counted_servers = 0

    for s in servers:
        latest_stmt = (
            select(Metric)
            .where(Metric.server_id == s.id)
            .order_by(Metric.timestamp.desc())
            .options(selectinload(Metric.disks))
            .limit(1)
        )
        latest_m = (await db.execute(latest_stmt)).scalar_one_or_none()
        if latest_m:
            counted_servers += 1
            total_cpu += latest_m.cpu_percent
            total_ram_used += latest_m.ram_used_mb
            total_ram_cap += s.ram_total_mb or latest_m.ram_used_mb

            for d in latest_m.disks:
                total_disk_used += d.used_gb
                total_disk_cap += d.total_gb

    avg_cpu = round(total_cpu / counted_servers, 1) if counted_servers > 0 else 0.0
    ram_pct = round((total_ram_used / total_ram_cap) * 100, 1) if total_ram_cap > 0 else 0.0
    disk_pct = round((total_disk_used / total_disk_cap) * 100, 1) if total_disk_cap > 0 else 0.0

    # Count active alerts
    alerts_stmt = select(func.count(Alert.id)).where(Alert.status == AlertStatus.ACTIVE.value)
    active_alerts = (await db.execute(alerts_stmt)).scalar() or 0

    return FleetSummaryResponse(
        total_servers=total,
        online_servers=online,
        delayed_servers=delayed,
        offline_servers=offline,
        overall_cpu_avg=avg_cpu,
        overall_ram_used_mb=total_ram_used,
        overall_ram_total_mb=total_ram_cap,
        overall_ram_percent=ram_pct,
        overall_disk_used_gb=round(total_disk_used, 1),
        overall_disk_total_gb=round(total_disk_cap, 1),
        overall_disk_percent=disk_pct,
        active_alerts=active_alerts,
        last_updated=datetime.utcnow()
    )

@router.get("/server/{server_id}/history", response_model=List[MetricSchema])
async def get_server_metric_history(
    server_id: int,
    timeframe: str = Query("1h", pattern="^(1h|6h|24h|7d)$"),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    delta_map = {
        "1h": timedelta(hours=1),
        "6h": timedelta(hours=6),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7)
    }
    cutoff = datetime.utcnow() - delta_map[timeframe]

    stmt = (
        select(Metric)
        .where(Metric.server_id == server_id, Metric.timestamp >= cutoff)
        .order_by(Metric.timestamp.asc())
        .options(selectinload(Metric.disks), selectinload(Metric.networks))
    )
    result = await db.execute(stmt)
    metrics = result.scalars().all()

    # If large dataset, downsample to max 120 points for smooth mobile rendering
    if len(metrics) > 120:
        step = len(metrics) // 120
        metrics = metrics[::step]

    return [MetricSchema.model_validate(m) for m in metrics]
