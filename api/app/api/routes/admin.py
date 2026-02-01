"""Admin router for managing users and administrative functions."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select, func
from app.core.database import get_session
from app.core.auth import require_admin
from app.models import User, UserRole, UserAsceticism, GroupMember
from app.schemas.admin import (
    UserResponse,
    UpdateRoleRequest,
    ToggleBanRequest,
    CurrentUserResponse,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserResponse])
async def get_all_users(
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """
    Get all users with their details and activity counts.
    Requires admin authentication.
    """

    # Get all users ordered by role
    statement = select(User).order_by(User.role.desc())
    users = session.exec(statement).all()

    result = []
    for user in users:
        # Count user asceticisms
        asceticisms_count_stmt = select(func.count(UserAsceticism.id)).where(
            UserAsceticism.userId == user.id
        )
        asceticisms_count = session.exec(asceticisms_count_stmt).one()

        # Count group memberships
        groups_count_stmt = select(func.count(GroupMember.id)).where(
            GroupMember.userId == user.id
        )
        groups_count = session.exec(groups_count_stmt).one()

        result.append(
            UserResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                image=user.image,
                role=user.role.value,
                isBanned=user.isBanned,
                emailVerified=(
                    user.emailVerified.isoformat() if user.emailVerified else None
                ),
                userAsceticismsCount=asceticisms_count,
                groupMembersCount=groups_count,
            )
        )

    return result


@router.post("/users/role")
async def update_user_role(
    request: UpdateRoleRequest,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """
    Update a user's role.
    Prevents admins from demoting themselves.
    """

    # Prevent users from demoting themselves
    if current_user.id == request.userId and request.newRole != UserRole.ADMIN:
        raise HTTPException(
            status_code=400, detail="You cannot change your own admin role"
        )

    # Validate role
    try:
        new_role = UserRole(request.newRole)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Get and update user
    user = session.get(User, request.userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = new_role
    session.add(user)
    session.commit()

    return {"success": True}


@router.post("/users/ban")
async def toggle_user_ban(
    request: ToggleBanRequest,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """
    Ban or unban a user.
    Prevents admins from banning themselves.
    """

    # Prevent users from banning themselves
    if current_user.id == request.userId:
        raise HTTPException(status_code=400, detail="You cannot ban yourself")

    # Get and update user
    user = session.get(User, request.userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.isBanned = request.isBanned
    session.add(user)
    session.commit()

    return {"success": True}


@router.get("/current-user", response_model=CurrentUserResponse)
async def get_current_user_info(
    current_user: User = Depends(require_admin),
):
    """
    Get current user info including role and ban status.
    """
    return CurrentUserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role.value,
        isBanned=current_user.isBanned,
    )
