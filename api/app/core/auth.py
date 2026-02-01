"""Authentication utilities for JWT token validation."""

from typing import Optional
import jwt
from fastapi import Header, HTTPException, Depends
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.config import settings
from app.models import User, UserRole


def verify_jwt_token(token: str) -> dict:
    """
    Verify and decode a JWT token from NextAuth.

    Args:
        token: The JWT token string

    Returns:
        The decoded token payload

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # NextAuth uses HS256 by default
        payload = jwt.decode(
            token,
            settings.NEXTAUTH_SECRET,
            algorithms=["HS256"],
            options={"verify_exp": True},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_user_by_email(email: str, session: Session) -> Optional[User]:
    """Get user by email from database."""
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


async def get_current_user(
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
) -> User:
    """
    Get the current authenticated user from JWT token.

    Args:
        authorization: Bearer token from Authorization header
        session: Database session

    Returns:
        The authenticated User object

    Raises:
        HTTPException: If authentication fails
    """
    if not authorization:
        raise HTTPException(
            status_code=401, detail="Not authenticated: Authorization header missing"
        )

    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected: Bearer <token>",
        )

    token = parts[1]

    # Verify and decode token
    payload = verify_jwt_token(token)

    # Get user email from token
    user_email = payload.get("email")
    if not user_email:
        raise HTTPException(status_code=401, detail="Token does not contain email")

    # Get user from database
    user = await get_user_by_email(user_email, session)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Check if user is banned
    if user.isBanned:
        raise HTTPException(status_code=403, detail="User is banned")

    return user


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Require that the current user is an admin.

    Args:
        current_user: The authenticated user

    Returns:
        The admin User object

    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user


async def require_moderator(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Require that the current user is at least a moderator.

    Args:
        current_user: The authenticated user

    Returns:
        The moderator/admin User object

    Raises:
        HTTPException: If user is not a moderator or admin
    """
    if current_user.role not in [UserRole.MODERATOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Moderator access required")

    return current_user
