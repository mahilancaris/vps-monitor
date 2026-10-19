import pytest
from app.utils.security import hash_password, verify_password, generate_totp_secret, verify_totp

def test_password_hashing():
    raw = "MyComplexUbuntuKey2026!"
    hashed = hash_password(raw)
    assert hashed != raw
    assert hashed.startswith("$argon2id$")
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_totp_generation():
    secret = generate_totp_secret()
    assert len(secret) >= 16

@pytest.mark.asyncio
async def test_login_success_and_profile(client, admin_token):
    # Test protected /me endpoint with token
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "testadmin"
    assert data["role"] == "admin"

@pytest.mark.asyncio
async def test_login_invalid_password(client):
    resp = await client.post("/api/auth/login", json={
        "username": "testadmin",
        "password": "WrongPassword999!"
    })
    assert resp.status_code == 401
    assert "Incorrect username or password" in resp.json()["detail"]
