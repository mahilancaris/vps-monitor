#!/usr/bin/env bash
# ==============================================================================
# VPS Fleet Monitor - Agent Installer for Ubuntu 24.04 / 22.04 LTS
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}      VPS Fleet Monitor - Agent Installer           ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Root Check
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[!] Please run as root or with sudo.${NC}"
    exit 1
fi

# 2. Check Ubuntu compatibility
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo -e "[*] Detected OS: ${PRETTY_NAME:-$ID}"
    if [[ "$ID" != "ubuntu" && "$ID_LIKE" != *"ubuntu"* && "$ID_LIKE" != *"debian"* ]]; then
        echo -e "${YELLOW}[!] Warning: This agent is tested primarily on Ubuntu/Debian. Proceeding anyway...${NC}"
    fi
else
    echo -e "${YELLOW}[!] Could not verify /etc/os-release. Proceeding...${NC}"
fi

# 3. Prompt for API URL and Token if not provided via environment
API_URL="${API_URL:-}"
AGENT_TOKEN="${AGENT_TOKEN:-}"

if [ -z "$API_URL" ]; then
    read -rp "Enter central API endpoint URL (e.g., https://monitor.example.com/api): " API_URL
fi

if [ -z "$AGENT_TOKEN" ]; then
    read -rp "Enter unique server agent token: " AGENT_TOKEN
fi

if [ -z "$API_URL" ] || [ -z "$AGENT_TOKEN" ]; then
    echo -e "${RED}[!] API URL and Agent Token are required.${NC}"
    exit 1
fi

# 4. Check for existing web server / services (non-destructive safety requirement)
echo -e "[*] Verifying existing services..."
if systemctl is-active --quiet nginx; then
    echo -e "    ${GREEN}[i] Nginx is running. We will NOT modify or disrupt Nginx config.${NC}"
fi
if systemctl is-active --quiet apache2; then
    echo -e "    ${GREEN}[i] Apache2 is running. We will NOT modify or disrupt Apache2 config.${NC}"
fi
if systemctl is-active --quiet caddy; then
    echo -e "    ${GREEN}[i] Caddy is running. We will NOT modify or disrupt Caddy config.${NC}"
fi

# 5. Create dedicated system user if not exists
if ! id -u fleet-agent >/dev/null 2>&1; then
    echo -e "[*] Creating dedicated system user 'fleet-agent'..."
    useradd -r -s /usr/sbin/nologin -d /opt/fleet-agent -M fleet-agent
fi

# 6. Install dependencies
echo -e "[*] Installing Python3 and virtualenv packages..."
apt-get update -qq
apt-get install -y -qq python3 python3-venv python3-pip iproute2 >/dev/null

# 7. Create directory structure
INSTALL_DIR="/opt/fleet-agent"
CONFIG_DIR="/etc/fleet-agent"
mkdir -p "$INSTALL_DIR"
mkdir -p "$CONFIG_DIR"

# 8. Copy or Download Agent script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"
if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/fleet_agent.py" ]; then
    cp "$SCRIPT_DIR/fleet_agent.py" "$INSTALL_DIR/fleet_agent.py"
else
    echo -e "[*] Downloading fleet_agent.py from $API_URL/agent/fleet_agent.py..."
    curl -fsSL "$API_URL/agent/fleet_agent.py" -o "$INSTALL_DIR/fleet_agent.py"
fi
chmod 755 "$INSTALL_DIR/fleet_agent.py"

# 9. Setup Python Virtual Environment
echo -e "[*] Setting up Python virtual environment..."
python3 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install --quiet --upgrade pip
"$INSTALL_DIR/venv/bin/pip" install --quiet psutil

# 10. Write secure configuration (0600 permissions, owned by fleet-agent)
CONFIG_FILE="$CONFIG_DIR/config.json"
cat > "$CONFIG_FILE" <<EOF
{
  "api_url": "$API_URL",
  "agent_token": "$AGENT_TOKEN",
  "heartbeat_interval": 15,
  "metrics_interval": 15,
  "verify_ssl": true
}
EOF
chown -R fleet-agent:fleet-agent "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"
chmod 600 "$CONFIG_FILE"

chown -R fleet-agent:fleet-agent "$INSTALL_DIR"

# 11. Install systemd service
echo -e "[*] Installing systemd unit..."
if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/fleet-agent.service" ]; then
    cp "$SCRIPT_DIR/fleet-agent.service" /etc/systemd/system/fleet-agent.service
else
    echo -e "[*] Downloading fleet-agent.service from $API_URL/agent/fleet-agent.service..."
    curl -fsSL "$API_URL/agent/fleet-agent.service" -o /etc/systemd/system/fleet-agent.service
fi
systemctl daemon-reload
systemctl enable fleet-agent.service
systemctl restart fleet-agent.service

# 12. Verification
sleep 2
if systemctl is-active --quiet fleet-agent; then
    echo -e "${GREEN}====================================================${NC}"
    echo -e "${GREEN}[✔] VPS Fleet Agent installed and running!          ${NC}"
    echo -e "${GREEN}    Endpoint: $API_URL                              ${NC}"
    echo -e "${GREEN}    Status: systemctl status fleet-agent            ${NC}"
    echo -e "${GREEN}    Logs:   journalctl -u fleet-agent -f            ${NC}"
    echo -e "${GREEN}====================================================${NC}"
else
    echo -e "${RED}[!] Agent failed to start. Check logs:${NC}"
    journalctl -u fleet-agent -n 20 --no-pager
    exit 1
fi
