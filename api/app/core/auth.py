"""Authentication utilities for API routes."""

from typing import Optional
from fastapi import HTTPException
from sqlmodel import Session, select
from app.models import User, UserRole


async def get_user_by_email(email: str, session: Session) -> Optional[User]:
    """Get user by email."""
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


async def require_authenticated_user(
    x_user_email: Optional[str], session: Session
) -> User:
    """Verify that the user is authenticated and not banned."""
    if not x_user_email:
        raise HTTPException(status_code=401, detail="Unauthorized: Not logged in")

    user = await get_user_by_email(x_user_email, session)

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized: User not found")

    if user.isBanned:
        raise HTTPException(status_code=403, detail="Unauthorized: User is banned")

    return user


async def require_admin(x_user_email: Optional[str], session: Session) -> User:
    """Verify that the user is an admin."""
    user = await require_authenticated_user(x_user_email, session)

    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403, detail="Unauthorized: Admin access required"
        )

    return user
