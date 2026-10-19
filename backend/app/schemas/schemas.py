from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ---------------------------------------------------------------------------
# Auth Schemas
# ---------------------------------------------------------------------------
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserResponse"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LoginRequest(BaseModel):
    username: str
    password: str
    totp_code: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class TOTPSetupResponse(BaseModel):
    secret: str
    provisioning_uri: str
    qr_svg: Optional[str] = None

class TOTPVerifyRequest(BaseModel):
    code: str

class UserBase(BaseModel):
    username: str
    email: str
    role: str = "readonly"
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    totp_enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# Server Schemas
# ---------------------------------------------------------------------------
class ServerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    location: str = Field("Home", max_length=100)
    hostname: Optional[str] = None
    public_ip: Optional[str] = None
    private_ip: Optional[str] = None

class ServerCreate(ServerBase):
    pass

class ServerUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    hostname: Optional[str] = None
    public_ip: Optional[str] = None
    private_ip: Optional[str] = None
    is_active: Optional[bool] = None

class DiskMetricSchema(BaseModel):
    mount_point: str
    filesystem: Optional[str] = None
    total_gb: float
    used_gb: float
    percent_used: float

    class Config:
        from_attributes = True

class NetworkMetricSchema(BaseModel):
    interface: str
    bytes_sent: float
    bytes_recv: float
    tx_sec: float = 0.0
    rx_sec: float = 0.0

    class Config:
        from_attributes = True

class MetricSchema(BaseModel):
    id: int
    timestamp: datetime
    cpu_percent: float
    load_1: float
    load_5: float
    load_15: float
    ram_used_mb: int
    ram_percent: float
    swap_used_mb: int
    swap_percent: float
    uptime_seconds: int
    temperature_c: Optional[float] = None
    battery_percent: Optional[float] = None
    battery_charging: Optional[bool] = None
    disks: List[DiskMetricSchema] = []
    networks: List[NetworkMetricSchema] = []

    class Config:
        from_attributes = True

class ListeningPortSchema(BaseModel):
    id: int
    port: int
    protocol: str
    address: str
    process_name: Optional[str] = None
    pid: Optional[int] = None
    is_wildcard: bool
    is_public_facing: bool
    last_seen: datetime

    class Config:
        from_attributes = True

class ServerResponse(ServerBase):
    id: int
    os_info: Optional[str] = None
    status: str
    last_heartbeat: Optional[datetime] = None
    cpu_model: Optional[str] = None
    cpu_cores: int
    ram_total_mb: int
    disk_total_gb: float
    is_active: bool
    created_at: datetime
    updated_at: datetime
    latest_metric: Optional[MetricSchema] = None

    class Config:
        from_attributes = True

class ServerDetailResponse(ServerResponse):
    recent_metrics: List[MetricSchema] = []
    listening_ports: List[ListeningPortSchema] = []
    active_alerts_count: int = 0

# ---------------------------------------------------------------------------
# Agent Communication Schemas
# ---------------------------------------------------------------------------
class PortPayload(BaseModel):
    port: int
    protocol: str = "tcp"
    address: str = "0.0.0.0"
    process_name: Optional[str] = None
    pid: Optional[int] = None

class DiskPayload(BaseModel):
    mount_point: str
    filesystem: Optional[str] = None
    total_gb: float
    used_gb: float
    percent_used: float

class NetworkPayload(BaseModel):
    interface: str
    bytes_sent: float
    bytes_recv: float
    tx_sec: float = 0.0
    rx_sec: float = 0.0

class AgentHeartbeatPayload(BaseModel):
    agent_version: str = "1.0.0"
    os_info: Optional[str] = None
    hostname: Optional[str] = None
    uptime_seconds: Optional[int] = None

class AgentMetricsPayload(BaseModel):
    agent_version: str = "1.0.0"
    os_info: Optional[str] = None
    hostname: Optional[str] = None
    cpu_model: Optional[str] = None
    cpu_cores: Optional[int] = 1
    ram_total_mb: Optional[int] = 0
    disk_total_gb: Optional[float] = 0.0
    cpu_percent: float
    load_1: float = 0.0
    load_5: float = 0.0
    load_15: float = 0.0
    ram_used_mb: int
    ram_percent: float
    swap_used_mb: int = 0
    swap_percent: float = 0.0
    uptime_seconds: int = 0
    temperature_c: Optional[float] = None
    battery_percent: Optional[float] = None
    battery_charging: Optional[bool] = None
    disks: List[DiskPayload] = []
    networks: List[NetworkPayload] = []
    ports: List[PortPayload] = []

class AgentCredentialResponse(BaseModel):
    id: int
    server_id: int
    name: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime
    # The cleartext token is ONLY returned immediately upon generation/rotation!
    raw_token: Optional[str] = None

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# Alert Schemas
# ---------------------------------------------------------------------------
class AlertResponse(BaseModel):
    id: int
    server_id: int
    server_name: Optional[str] = None
    server_location: Optional[str] = None
    alert_type: str
    severity: str
    title: str
    message: str
    status: str
    triggered_at: datetime
    acknowledged_at: Optional[datetime] = None
    acknowledged_by_user_id: Optional[int] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    resolved: bool = False

class NotificationSettingResponse(BaseModel):
    id: int
    channel: str
    is_enabled: bool
    min_severity: str
    config_json: str

    class Config:
        from_attributes = True

class NotificationSettingUpdate(BaseModel):
    is_enabled: bool
    min_severity: str = "warning"
    config: Dict[str, Any] = {}

# ---------------------------------------------------------------------------
# Audit Log & Fleet Overview Schemas
# ---------------------------------------------------------------------------
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FleetSummaryResponse(BaseModel):
    total_servers: int
    online_servers: int
    delayed_servers: int
    offline_servers: int
    overall_cpu_avg: float
    overall_ram_used_mb: int
    overall_ram_total_mb: int
    overall_ram_percent: float
    overall_disk_used_gb: float
    overall_disk_total_gb: float
    overall_disk_percent: float
    active_alerts: int
    last_updated: datetime
