"""initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('username', sa.String(length=64), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), server_default='readonly', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('totp_secret', sa.String(length=64), nullable=True),
        sa.Column('totp_enabled', sa.Boolean(), server_default='0', nullable=False),
        sa.Column('failed_login_attempts', sa.Integer(), server_default='0', nullable=False),
        sa.Column('locked_until', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_users_username', 'users', ['username'], unique=True)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Servers table
    op.create_table(
        'servers',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('location', sa.String(length=100), nullable=False),
        sa.Column('hostname', sa.String(length=255), nullable=True),
        sa.Column('public_ip', sa.String(length=64), nullable=True),
        sa.Column('private_ip', sa.String(length=64), nullable=True),
        sa.Column('os_info', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=32), server_default='offline', nullable=False),
        sa.Column('last_heartbeat', sa.DateTime(), nullable=True),
        sa.Column('cpu_model', sa.String(length=128), nullable=True),
        sa.Column('cpu_cores', sa.Integer(), server_default='1'),
        sa.Column('ram_total_mb', sa.Integer(), server_default='0'),
        sa.Column('disk_total_gb', sa.Float(), server_default='0.0'),
        sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_servers_name', 'servers', ['name'])
    op.create_index('ix_servers_status', 'servers', ['status'])
    op.create_index('ix_servers_last_heartbeat', 'servers', ['last_heartbeat'])

    # Agent Credentials table
    op.create_table(
        'agent_credentials',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('server_id', sa.Integer(), sa.ForeignKey('servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(length=128), nullable=False),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_agent_credentials_token_hash', 'agent_credentials', ['token_hash'], unique=True)
    op.create_index('ix_agent_credentials_server_id', 'agent_credentials', ['server_id'])

    # Heartbeats table
    op.create_table(
        'heartbeats',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('server_id', sa.Integer(), sa.ForeignKey('servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('agent_version', sa.String(length=32), nullable=True),
        sa.Column('source_ip', sa.String(length=64), nullable=True),
    )
    op.create_index('idx_heartbeat_server_time', 'heartbeats', ['server_id', 'timestamp'])

    # Metrics table
    op.create_table(
        'metrics',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('server_id', sa.Integer(), sa.ForeignKey('servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('cpu_percent', sa.Float(), nullable=False),
        sa.Column('load_1', sa.Float(), server_default='0.0'),
        sa.Column('load_5', sa.Float(), server_default='0.0'),
        sa.Column('load_15', sa.Float(), server_default='0.0'),
        sa.Column('ram_used_mb', sa.Integer(), nullable=False),
        sa.Column('ram_percent', sa.Float(), nullable=False),
        sa.Column('swap_used_mb', sa.Integer(), server_default='0'),
        sa.Column('swap_percent', sa.Float(), server_default='0.0'),
        sa.Column('uptime_seconds', sa.Integer(), server_default='0'),
        sa.Column('temperature_c', sa.Float(), nullable=True),
        sa.Column('battery_percent', sa.Float(), nullable=True),
        sa.Column('battery_charging', sa.Boolean(), nullable=True),
    )
    op.create_index('idx_metric_server_time', 'metrics', ['server_id', 'timestamp'])

    # Disk metrics
    op.create_table(
        'disk_metrics',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('metric_id', sa.Integer(), sa.ForeignKey('metrics.id', ondelete='CASCADE'), nullable=True),
        sa.Column('server_id', sa.Integer(), sa.ForeignKey('servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('mount_point', sa.String(length=128), nullable=False),
        sa.Column('filesystem', sa.String(length=64), nullable=True),
        sa.Column('total_gb', sa.Float(), nullable=False),
        sa.Column('used_gb', sa.Float(), nullable=False),
        sa.Column('percent_used', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_disk_metrics_server_id', 'disk_metrics', ['server_id'])

    # Network metrics
    op.create_table(
        'network_metrics',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('metric_id', sa.Integer(), sa.ForeignKey('metrics.id', ondelete='CASCADE'), nullable=True),
        sa.Column('server_id', sa.Integer(), sa.ForeignKey('servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('interface', sa.String(length=64), nullable=False),
        sa.Column('bytes_sent', sa.Float(), server_default='0.0'),
        sa.Column('bytes_recv', sa.Float(), server_default='0.0'),
        sa.Column('tx_sec', sa.Float(), server_default='0.0'),
        sa.Column('rx_sec', sa.Float(), server_default='0.0'),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_network_metrics_server_id', 'network_metrics', ['server_id'])

    # Listening ports
    op.create_table(
        'listening_ports',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('server_id', sa.Integer(), sa.ForeignKey('servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('port', sa.Integer(), nullable=False),
        sa.Column('protocol', sa.String(length=16), nullable=False),
        sa.Column('address', sa.String(length=64), nullable=False),
        sa.Column('process_name', sa.String(length=128), nullable=True),
        sa.Column('pid', sa.Integer(), nullable=True),
        sa.Column('is_wildcard', sa.Boolean(), server_default='0'),
        sa.Column('is_public_facing', sa.Boolean(), server_default='0'),
        sa.Column('last_seen', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_port_server_protocol_port', 'listening_ports', ['server_id', 'protocol', 'port'])

    # Alerts
    op.create_table(
        'alerts',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('server_id', sa.Integer(), sa.ForeignKey('servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('alert_type', sa.String(length=64), nullable=False),
        sa.Column('severity', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=32), server_default='active', nullable=False),
        sa.Column('triggered_at', sa.DateTime(), nullable=False),
        sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
        sa.Column('acknowledged_by_user_id', sa.Integer(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_alerts_server_id', 'alerts', ['server_id'])
    op.create_index('ix_alerts_status', 'alerts', ['status'])

    # Audit logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=128), nullable=False),
        sa.Column('target_type', sa.String(length=64), nullable=True),
        sa.Column('target_id', sa.String(length=64), nullable=True),
        sa.Column('ip_address', sa.String(length=64), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])

    # Notification settings
    op.create_table(
        'notification_settings',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('channel', sa.String(length=32), nullable=False),
        sa.Column('config_json', sa.Text(), server_default='{}'),
        sa.Column('is_enabled', sa.Boolean(), server_default='0'),
        sa.Column('min_severity', sa.String(length=32), server_default='warning'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_notification_settings_channel', 'notification_settings', ['channel'], unique=True)

def downgrade() -> None:
    op.drop_table('notification_settings')
    op.drop_table('audit_logs')
    op.drop_table('alerts')
    op.drop_table('listening_ports')
    op.drop_table('network_metrics')
    op.drop_table('disk_metrics')
    op.drop_table('metrics')
    op.drop_table('heartbeats')
    op.drop_table('agent_credentials')
    op.drop_table('servers')
    op.drop_table('users')
