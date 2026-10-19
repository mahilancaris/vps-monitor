from typing import Optional, Tuple
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.database import get_db
from app.config import settings
from app.utils.security import decode_token, hash_agent_token
from app.models.models import User, Server, AgentCredential, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or disabled"
        )
    
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is temporarily locked due to excessive failed logins"
        )

    return user

async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required"
        )
    return current_user

async def get_current_agent_server(
    authorization: Optional[str] = Header(None),
    x_server_token: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Tuple[Server, AgentCredential]:
    """
    Authenticate monitoring agent via X-Server-Token or Authorization: Bearer <agent_token>.
    Tokens are hashed with SHA-256 before comparison against stored credential hashes.
    """
    token = None
    if x_server_token:
        token = x_server_token.strip()
    elif authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing agent authentication token header (X-Server-Token or Bearer token)"
        )

    hashed = hash_agent_token(token)
    stmt = (
        select(AgentCredential)
        .options(selectinload(AgentCredential.server))
        .where(AgentCredential.token_hash == hashed, AgentCredential.is_active == True)
    )
    result = await db.execute(stmt)
    credential = result.scalar_one_or_none()

    if not credential or not credential.server or not credential.server.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked agent credentials"
        )

    # Update last_used_at timestamp on credential
    credential.last_used_at = datetime.utcnow()
    await db.commit()

    return credential.server, credential
