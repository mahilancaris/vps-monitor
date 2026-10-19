#!/usr/bin/env python3
"""
Metric & Audit Retention Pruner
Runs via cron or systemd timer to delete metrics older than METRIC_RETENTION_DAYS (default 30 days).
Prevents database storage ballooning.
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import delete
from app.database import AsyncSessionLocal
from app.config import settings
from app.models.models import Metric, Heartbeat, AuditLog

async def prune():
    cutoff = datetime.utcnow() - timedelta(days=settings.METRIC_RETENTION_DAYS)
    print(f"[*] Pruning metrics and heartbeats older than {cutoff.isoformat()} ({settings.METRIC_RETENTION_DAYS} days)...")

    async with AsyncSessionLocal() as db:
        # Delete old metrics (cascades to disk_metrics and network_metrics)
        stmt_metrics = delete(Metric).where(Metric.timestamp < cutoff)
        res_m = await db.execute(stmt_metrics)

        # Delete old heartbeats
        stmt_hb = delete(Heartbeat).where(Heartbeat.timestamp < cutoff)
        res_hb = await db.execute(stmt_hb)

        # Keep audit logs for 90 days
        audit_cutoff = datetime.utcnow() - timedelta(days=90)
        stmt_audit = delete(AuditLog).where(AuditLog.created_at < audit_cutoff)
        res_a = await db.execute(stmt_audit)

        await db.commit()
        print(f"[✔] Pruning complete: {res_m.rowcount} metrics, {res_hb.rowcount} heartbeats, {res_a.rowcount} audit logs removed.")

if __name__ == "__main__":
    asyncio.run(prune())
