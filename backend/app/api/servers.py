from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.database import get_db
from app.models.models import (
    Server, Metric, DiskMetric, NetworkMetric, ListeningPort,
    Alert, AlertStatus, AgentCredential, AuditLog, ServerStatus
)
from app.schemas.schemas import (
    ServerResponse, ServerCreate, ServerUpdate, ServerDetailResponse,
    MetricSchema, ListeningPortSchema, AgentCredentialResponse
)
from app.api.deps import get_current_user, get_current_admin
from app.utils.security import generate_agent_token, hash_agent_token
from app.services.ws_manager import ws_manager

router = APIRouter(prefix="/servers", tags=["Servers Registry"])

@router.get("", response_model=List[ServerResponse])
async def list_servers(
    location: Optional[str] = None,
    status_filter: Optional[str] = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Server).where(Server.is_active == True)
    if location:
        query = query.where(Server.location == location)
    if status_filter:
        query = query.where(Server.status == status_filter)

    query = query.order_by(Server.id.asc())
    result = await db.execute(query)
    servers = result.scalars().all()

    response_list = []
    for s in servers:
        # Load latest metric for server
        latest_metric_stmt = (
            select(Metric)
            .where(Metric.server_id == s.id)
            .order_by(Metric.timestamp.desc())
            .options(selectinload(Metric.disks), selectinload(Metric.networks))
            .limit(1)
        )
        metric_res = await db.execute(latest_metric_stmt)
        latest_m = metric_res.scalar_one_or_none()

        sr = ServerResponse.model_validate(s)
        if latest_m:
            sr.latest_metric = MetricSchema.model_validate(latest_m)
        response_list.append(sr)

    return response_list

@router.post("", response_model=ServerResponse, status_code=status.HTTP_201_CREATED)
async def create_server(
    server_in: ServerCreate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    server = Server(
        name=server_in.name,
        location=server_in.location,
        hostname=server_in.hostname,
        public_ip=server_in.public_ip,
        private_ip=server_in.private_ip,
        status=ServerStatus.OFFLINE.value,
        is_active=True
    )
    db.add(server)
    await db.commit()
    await db.refresh(server)

    db.add(AuditLog(
        user_id=admin.id,
        action="create_server",
        target_type="server",
        target_id=str(server.id),
        details=f"Created server '{server.name}' in '{server.location}'"
    ))
    await db.commit()

    await ws_manager.broadcast({"event": "server_added", "server_id": server.id, "name": server.name})
    return ServerResponse.model_validate(server)

@router.get("/{server_id}", response_model=ServerDetailResponse)
async def get_server_detail(
    server_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Server).where(Server.id == server_id, Server.is_active == True)
    res = await db.execute(stmt)
    server = res.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    # Get recent metrics (last 30 points)
    metrics_stmt = (
        select(Metric)
        .where(Metric.server_id == server_id)
        .order_by(Metric.timestamp.desc())
        .options(selectinload(Metric.disks), selectinload(Metric.networks))
        .limit(30)
    )
    metrics_res = await db.execute(metrics_stmt)
    recent_metrics = list(reversed(metrics_res.scalars().all()))

    # Get listening ports
    ports_stmt = (
        select(ListeningPort)
        .where(ListeningPort.server_id == server_id)
        .order_by(ListeningPort.port.asc())
    )
    ports_res = await db.execute(ports_stmt)
    ports = ports_res.scalars().all()

    # Active alerts count
    alerts_stmt = select(func.count(Alert.id)).where(
        Alert.server_id == server_id,
        Alert.status == AlertStatus.ACTIVE.value
    )
    alerts_count = (await db.execute(alerts_stmt)).scalar() or 0

    return ServerDetailResponse(
        id=server.id,
        name=server.name,
        location=server.location,
        hostname=server.hostname,
        public_ip=server.public_ip,
        private_ip=server.private_ip,
        os_info=server.os_info,
        status=server.status,
        last_heartbeat=server.last_heartbeat,
        cpu_model=server.cpu_model,
        cpu_cores=server.cpu_cores,
        ram_total_mb=server.ram_total_mb,
        disk_total_gb=server.disk_total_gb,
        is_active=server.is_active,
        created_at=server.created_at,
        updated_at=server.updated_at,
        latest_metric=MetricSchema.model_validate(recent_metrics[-1]) if recent_metrics else None,
        recent_metrics=[MetricSchema.model_validate(m) for m in recent_metrics],
        listening_ports=[ListeningPortSchema.model_validate(p) for p in ports],
        active_alerts_count=alerts_count
    )

@router.put("/{server_id}", response_model=ServerResponse)
async def update_server(
    server_id: int,
    server_in: ServerUpdate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Server).where(Server.id == server_id)
    res = await db.execute(stmt)
    server = res.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    update_data = server_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(server, field, val)
    server.updated_at = datetime.utcnow()

    db.add(AuditLog(
        user_id=admin.id,
        action="update_server",
        target_type="server",
        target_id=str(server.id),
        details=f"Updated server fields: {list(update_data.keys())}"
    ))
    await db.commit()
    await db.refresh(server)
    return ServerResponse.model_validate(server)

@router.delete("/{server_id}", status_code=status.HTTP_200_OK)
async def delete_server(
    server_id: int,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Server).where(Server.id == server_id)
    res = await db.execute(stmt)
    server = res.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    server_name = server.name
    await db.delete(server)

    db.add(AuditLog(
        user_id=admin.id,
        action="delete_server",
        target_type="server",
        target_id=str(server_id),
        details=f"Deleted server '{server_name}' and all associated history"
    ))
    await db.commit()

    await ws_manager.broadcast({"event": "server_deleted", "server_id": server_id})
    return {"status": "success", "message": f"Server '{server_name}' deleted"}

# --- Agent Credentials Management ---

@router.post("/{server_id}/credentials", response_model=AgentCredentialResponse)
async def create_agent_credential(
    server_id: int,
    name: str = "agent-token",
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Server).where(Server.id == server_id)
    res = await db.execute(stmt)
    server = res.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    raw_token = generate_agent_token()
    token_hash = hash_agent_token(raw_token)

    cred = AgentCredential(
        server_id=server.id,
        token_hash=token_hash,
        name=name,
        is_active=True
    )
    db.add(cred)
    await db.commit()
    await db.refresh(cred)

    db.add(AuditLog(
        user_id=admin.id,
        action="create_agent_credential",
        target_type="agent_credential",
        target_id=str(cred.id),
        details=f"Generated credential '{name}' for server {server.name}"
    ))
    await db.commit()

    resp = AgentCredentialResponse.model_validate(cred)
    resp.raw_token = raw_token # Only visible upon creation!
    return resp

@router.get("/{server_id}/credentials", response_model=List[AgentCredentialResponse])
async def list_agent_credentials(
    server_id: int,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AgentCredential).where(AgentCredential.server_id == server_id).order_by(AgentCredential.id.desc())
    res = await db.execute(stmt)
    creds = res.scalars().all()
    return [AgentCredentialResponse.model_validate(c) for c in creds]

@router.delete("/{server_id}/credentials/{cred_id}")
async def revoke_agent_credential(
    server_id: int,
    cred_id: int,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AgentCredential).where(
        AgentCredential.id == cred_id,
        AgentCredential.server_id == server_id
    )
    res = await db.execute(stmt)
    cred = res.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")

    cred.is_active = False
    cred.revoked_at = datetime.utcnow()

    db.add(AuditLog(
        user_id=admin.id,
        action="revoke_agent_credential",
        target_type="agent_credential",
        target_id=str(cred.id),
        details=f"Revoked credential for server {server_id}"
    ))
    await db.commit()
    return {"status": "success", "message": "Credential revoked"}
