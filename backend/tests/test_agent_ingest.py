import pytest

@pytest.mark.asyncio
async def test_agent_heartbeat_and_metric_ingest(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create server
    srv_res = await client.post("/api/servers", json={
        "name": "Home Ingest Test",
        "location": "Home"
    }, headers=headers)
    srv_id = srv_res.json()["id"]

    # Generate token
    cred_res = await client.post(f"/api/servers/{srv_id}/credentials", headers=headers)
    raw_token = cred_res.json()["raw_token"]

    agent_headers = {"X-Server-Token": raw_token}

    # Send Heartbeat
    hb_res = await client.post("/api/agent/heartbeat", json={
        "agent_version": "1.0.0",
        "hostname": "ubuntu-test-host",
        "os_info": "Ubuntu 24.04 LTS"
    }, headers=agent_headers)
    assert hb_res.status_code == 200

    # Ingest Full Metrics
    metrics_payload = {
        "agent_version": "1.0.0",
        "os_info": "Ubuntu 24.04 LTS",
        "hostname": "ubuntu-test-host",
        "cpu_percent": 24.5,
        "load_1": 0.45,
        "load_5": 0.32,
        "load_15": 0.28,
        "ram_used_mb": 2048,
        "ram_percent": 25.0,
        "ram_total_mb": 8192,
        "uptime_seconds": 12000,
        "disks": [
            {
                "mount_point": "/",
                "filesystem": "ext4",
                "total_gb": 100.0,
                "used_gb": 22.0,
                "percent_used": 22.0
            }
        ],
        "networks": [
            {
                "interface": "eth0",
                "bytes_sent": 50000.0,
                "bytes_recv": 90000.0,
                "tx_sec": 1200.0,
                "rx_sec": 3500.0
            }
        ],
        "ports": [
            {
                "port": 22,
                "protocol": "tcp",
                "address": "0.0.0.0",
                "process_name": "sshd",
                "pid": 800
            }
        ]
    }
    m_res = await client.post("/api/agent/metrics", json=metrics_payload, headers=agent_headers)
    assert m_res.status_code == 201
    assert m_res.json()["status"] == "recorded"

    # Verify server status transitioned to online
    srv_check = await client.get(f"/api/servers/{srv_id}", headers=headers)
    assert srv_check.status_code == 200
    srv_detail = srv_check.json()
    assert srv_detail["status"] == "online"
    assert len(srv_detail["listening_ports"]) == 1
    assert srv_detail["listening_ports"][0]["port"] == 22
