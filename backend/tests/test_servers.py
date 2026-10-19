import pytest

@pytest.mark.asyncio
async def test_server_crud_and_credential_generation(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create a server
    create_payload = {
        "name": "Singapore Test VPS",
        "location": "Singapore",
        "hostname": "sg-test-01",
        "public_ip": "139.180.201.88",
        "private_ip": "10.0.4.15"
    }
    resp = await client.post("/api/servers", json=create_payload, headers=headers)
    assert resp.status_code == 201
    server_data = resp.json()
    server_id = server_data["id"]
    assert server_data["name"] == "Singapore Test VPS"
    assert server_data["status"] == "offline"

    # 2. List servers
    list_resp = await client.get("/api/servers", headers=headers)
    assert list_resp.status_code == 200
    servers = list_resp.json()
    assert any(s["id"] == server_id for s in servers)

    # 3. Create Agent Credential Token
    cred_resp = await client.post(f"/api/servers/{server_id}/credentials", headers=headers)
    assert cred_resp.status_code == 200
    cred_data = cred_resp.json()
    assert "raw_token" in cred_data
    assert cred_data["raw_token"].startswith("fleet_agent_")
