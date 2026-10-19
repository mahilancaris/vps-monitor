# Backup and Disaster Recovery Guide

## 1. Automated PostgreSQL Backup (Docker Deployment)

Create `/usr/local/bin/backup-fleet-monitor.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/fleet-monitor"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="fleet_postgres"
DB_NAME="fleet_monitor"
DB_USER="fleet_user"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

echo "[*] Creating database backup: ${DATE}..."
docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "${BACKUP_DIR}/fleet_${DATE}.sql.gz"

# Rotate backups older than 14 days
find "$BACKUP_DIR" -type f -name "fleet_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[✔] Backup finished successfully: ${BACKUP_DIR}/fleet_${DATE}.sql.gz"
```

Make executable and schedule in cron:
```bash
sudo chmod +x /usr/local/bin/backup-fleet-monitor.sh

# Run every night at 2:30 AM
(crontab -l 2>/dev/null; echo "30 2 * * * /usr/local/bin/backup-fleet-monitor.sh >/dev/null 2>&1") | crontab -
```

---

## 2. Restoring PostgreSQL from Backup

```bash
# 1. Stop backend service to prevent ongoing writes
docker compose stop backend

# 2. Extract and import the backup
gunzip < /var/backups/fleet-monitor/fleet_20261019_023000.sql.gz | docker exec -i fleet_postgres psql -U fleet_user -d fleet_monitor

# 3. Restart backend service
docker compose start backend

# 4. Verify system health
curl -s http://localhost:8000/api/system/health | jq .
```

---

## 3. Backing Up SQLite (Non-Docker / Local Dev)

If running in local development mode using SQLite (`fleet_monitor.db`):

```bash
# Safe live SQLite backup via sqlite3 CLI
sqlite3 fleet_monitor.db ".backup 'fleet_backup_$(date +%Y%m%d).db'"
```

To restore:
```bash
cp fleet_backup_20261019.db fleet_monitor.db
```
