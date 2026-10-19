import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    READONLY = "readonly"

class ServerStatus(str, enum.Enum):
    ONLINE = "online"
    DELAYED = "delayed"
    OFFLINE = "offline"
    DISABLED = "disabled"

class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), default=UserRole.ADMIN.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    totp_secret = Column(String(64), nullable=True)
    totp_enabled = Column(Boolean, default=False, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    audit_logs = relationship("AuditLog", back_populates="user")

class Server(Base):
    __tablename__ = "servers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    location = Column(String(100), default="Home", nullable=False) # e.g. "Home", "Singapore VPS", "Frankfurt"
    hostname = Column(String(255), nullable=True)
    public_ip = Column(String(64), nullable=True)
    private_ip = Column(String(64), nullable=True)
    os_info = Column(String(255), nullable=True) # e.g. "Ubuntu 24.04.1 LTS (x86_64)"
    status = Column(String(32), default=ServerStatus.OFFLINE.value, index=True, nullable=False)
    last_heartbeat = Column(DateTime, index=True, nullable=True)
    cpu_model = Column(String(128), nullable=True)
    cpu_cores = Column(Integer, default=1)
    ram_total_mb = Column(Integer, default=0)
    disk_total_gb = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    credentials = relationship("AgentCredential", back_populates="server", cascade="all, delete-orphan")
    metrics = relationship("Metric", back_populates="server", cascade="all, delete-orphan")
    disk_metrics = relationship("DiskMetric", back_populates="server", cascade="all, delete-orphan")
    network_metrics = relationship("NetworkMetric", back_populates="server", cascade="all, delete-orphan")
    listening_ports = relationship("ListeningPort", back_populates="server", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="server", cascade="all, delete-orphan")
    heartbeats = relationship("Heartbeat", back_populates="server", cascade="all, delete-orphan")

class AgentCredential(Base):
    __tablename__ = "agent_credentials"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(128), unique=True, index=True, nullable=False)
    name = Column(String(64), default="default-agent", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    revoked_at = Column(DateTime, nullable=True)

    server = relationship("Server", back_populates="credentials")

class Heartbeat(Base):
    __tablename__ = "heartbeats"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    agent_version = Column(String(32), default="1.0.0")
    source_ip = Column(String(64), nullable=True)

    server = relationship("Server", back_populates="heartbeats")

    __table_args__ = (
        Index("idx_heartbeat_server_time", "server_id", "timestamp"),
    )

class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    cpu_percent = Column(Float, nullable=False)
    load_1 = Column(Float, default=0.0)
    load_5 = Column(Float, default=0.0)
    load_15 = Column(Float, default=0.0)
    ram_used_mb = Column(Integer, nullable=False)
    ram_percent = Column(Float, nullable=False)
    swap_used_mb = Column(Integer, default=0)
    swap_percent = Column(Float, default=0.0)
    uptime_seconds = Column(Integer, default=0)
    temperature_c = Column(Float, nullable=True)
    battery_percent = Column(Float, nullable=True)
    battery_charging = Column(Boolean, nullable=True)

    server = relationship("Server", back_populates="metrics")
    disks = relationship("DiskMetric", back_populates="metric", cascade="all, delete-orphan")
    networks = relationship("NetworkMetric", back_populates="metric", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_metric_server_time", "server_id", "timestamp"),
    )

class DiskMetric(Base):
    __tablename__ = "disk_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_id = Column(Integer, ForeignKey("metrics.id", ondelete="CASCADE"), nullable=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    mount_point = Column(String(128), nullable=False)
    filesystem = Column(String(64), nullable=True)
    total_gb = Column(Float, nullable=False)
    used_gb = Column(Float, nullable=False)
    percent_used = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    server = relationship("Server", back_populates="disk_metrics")
    metric = relationship("Metric", back_populates="disks")

class NetworkMetric(Base):
    __tablename__ = "network_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_id = Column(Integer, ForeignKey("metrics.id", ondelete="CASCADE"), nullable=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    interface = Column(String(64), nullable=False)
    bytes_sent = Column(Float, default=0.0)
    bytes_recv = Column(Float, default=0.0)
    tx_sec = Column(Float, default=0.0) # bytes/sec
    rx_sec = Column(Float, default=0.0) # bytes/sec
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    server = relationship("Server", back_populates="network_metrics")
    metric = relationship("Metric", back_populates="networks")

class ListeningPort(Base):
    __tablename__ = "listening_ports"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    port = Column(Integer, nullable=False, index=True)
    protocol = Column(String(16), default="tcp", nullable=False) # tcp, udp
    address = Column(String(64), default="0.0.0.0", nullable=False) # 127.0.0.1, 0.0.0.0, ::
    process_name = Column(String(128), default="unknown", nullable=True)
    pid = Column(Integer, nullable=True)
    is_wildcard = Column(Boolean, default=False)
    is_public_facing = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.utcnow, nullable=False)

    server = relationship("Server", back_populates="listening_ports")

    __table_args__ = (
        Index("idx_port_server_protocol_port", "server_id", "protocol", "port"),
    )

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(64), nullable=False) # e.g. server_offline, high_cpu, high_ram, high_disk
    severity = Column(String(32), default=AlertSeverity.WARNING.value, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(32), default=AlertStatus.ACTIVE.value, index=True, nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by_user_id = Column(Integer, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    server = relationship("Server", back_populates="alerts")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(128), nullable=False)
    target_type = Column(String(64), nullable=True)
    target_id = Column(String(64), nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    user = relationship("User", back_populates="audit_logs")

class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String(32), unique=True, nullable=False) # 'telegram', 'email'
    config_json = Column(Text, default="{}")
    is_enabled = Column(Boolean, default=False)
    min_severity = Column(String(32), default=AlertSeverity.WARNING.value)
    created_at = Column(DateTime, default=datetime.utcnow)
