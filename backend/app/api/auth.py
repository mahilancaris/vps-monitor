import io
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import qrcode
import qrcode.image.svg

from app.database import get_db
from app.config import settings
from app.models.models import User, AuditLog, UserRole
from app.schemas.schemas import (
    LoginRequest, Token, RefreshTokenRequest, UserResponse,
    PasswordChangeRequest, TOTPSetupResponse, TOTPVerifyRequest
)
from app.utils.security import (
    verify_password, hash_password, create_access_token,
    create_refresh_token, decode_token, generate_totp_secret,
    get_totp_uri, verify_totp
)
from app.utils.rate_limiter import rate_limiter, rate_limit_middleware_check
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    # Rate limit check per IP: 5 attempts per min
    rate_limit_middleware_check(request, max_requests=settings.LOGIN_RATE_LIMIT_PER_MINUTE, window_seconds=60)

    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    # Check account lockout
    if rate_limiter.is_account_locked(req.username):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked due to {settings.ACCOUNT_LOCKOUT_ATTEMPTS} consecutive failed login attempts. Please wait {settings.ACCOUNT_LOCKOUT_MINUTES} minutes."
        )

    stmt = select(User).where(User.username == req.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        failures = rate_limiter.record_failed_login(req.username)
        # Log failed attempt
        db.add(AuditLog(
            user_id=user.id if user else None,
            action="login_failed",
            target_type="user",
            target_id=req.username,
            ip_address=client_ip,
            user_agent=user_agent,
            details=f"Invalid password or user not found. Attempt count: {failures}"
        ))
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    # 2FA check if enabled
    if user.totp_enabled:
        if not req.totp_code or not verify_totp(user.totp_secret, req.totp_code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Valid TOTP two-factor authentication code required"
            )

    # Reset failure counter on success
    rate_limiter.reset_failed_logins(req.username)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Log successful login
    db.add(AuditLog(
        user_id=user.id,
        action="login_success",
        target_type="user",
        target_id=str(user.id),
        ip_address=client_ip,
        user_agent=user_agent,
        details="User authenticated successfully"
    ))
    await db.commit()

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )

@router.post("/refresh", response_model=Token)
async def refresh_token_endpoint(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user_id = int(payload.get("sub"))
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")

    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)

    return Token(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)

@router.post("/change-password")
async def change_password(
    req: PasswordChangeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(req.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match"
        )

    user.hashed_password = hash_password(req.new_password)
    user.updated_at = datetime.utcnow()
    await db.commit()
    return {"status": "success", "message": "Password changed successfully"}

@router.post("/totp/setup", response_model=TOTPSetupResponse)
async def totp_setup(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, user.username)

    # Generate QR Code SVG string
    factory = qrcode.image.svg.SvgPathImage
    img = qrcode.make(uri, image_factory=factory)
    svg_stream = io.BytesIO()
    img.save(svg_stream)
    svg_str = svg_stream.getvalue().decode("utf-8")

    user.totp_secret = secret
    await db.commit()

    return TOTPSetupResponse(
        secret=secret,
        provisioning_uri=uri,
        qr_svg=svg_str
    )

@router.post("/totp/verify")
async def totp_verify(
    req: TOTPVerifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="TOTP not initialized. Call /setup first.")
    
    if not verify_totp(user.totp_secret, req.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user.totp_enabled = True
    await db.commit()
    return {"status": "success", "message": "Two-factor authentication enabled successfully"}

@router.post("/totp/disable")
async def totp_disable(
    req: TOTPVerifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not user.totp_enabled:
        return {"status": "success", "message": "TOTP already disabled"}

    if not verify_totp(user.totp_secret, req.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user.totp_enabled = False
    user.totp_secret = None
    await db.commit()
    return {"status": "success", "message": "Two-factor authentication disabled"}

@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    return {"status": "success", "message": "Logged out successfully"}
