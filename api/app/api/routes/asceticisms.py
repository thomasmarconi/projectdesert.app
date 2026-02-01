"""Asceticisms router for managing user ascetical practices."""

from typing import Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import Session, select, and_, or_, func
from app.core.database import get_session
from app.core.auth import get_current_user, require_admin
from app.models import (
    Asceticism,
    UserAsceticism,
    AsceticismLog,
    TrackingType,
    AsceticismStatus,
    User,
    UserRole,
)
from app.schemas.asceticisms import (
    AsceticismCreate,
    AsceticismResponse,
    UserAsceticismLink,
    UserAsceticismResponse,
    UserAsceticismUpdate,
    UserAsceticismWithDetails,
    LogCreate,
    LogUpdate,
    LogResponse,
    AsceticismProgressResponse,
)

router = APIRouter()


def parse_date(date_str: str) -> datetime:
    """Parse YYYY-MM-DD or ISO datetime string to datetime."""
    if "T" not in date_str:
        return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    else:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))


@router.get(
    "/asceticisms/", tags=["asceticisms"], response_model=list[AsceticismResponse]
)
async def list_asceticisms(
    category: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """List all available asceticism templates."""
    statement = select(Asceticism).where(Asceticism.isTemplate == True)
    if category:
        statement = statement.where(Asceticism.category == category)

    asceticisms = session.exec(statement).all()
    return asceticisms


@router.post("/asceticisms/", tags=["asceticisms"], response_model=AsceticismResponse)
async def create_asceticism(
    item: AsceticismCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a new asceticism. Requires admin for templates, auth for custom."""
    is_template = item.creatorId is None

    # Only admins can create templates
    if is_template and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403, detail="Only admins can create asceticism templates"
        )

    # If creating custom, ensure creatorId matches current user
    if not is_template and item.creatorId != current_user.id:
        raise HTTPException(
            status_code=403, detail="Cannot create asceticism for another user"
        )

    asceticism = Asceticism(
        title=item.title,
        category=item.category,
        type=item.type,
        isTemplate=is_template,
        description=item.description,
        icon=item.icon,
        custom_metadata=item.custom_metadata,
        creatorId=item.creatorId,
    )

    session.add(asceticism)
    session.commit()
    session.refresh(asceticism)

    return asceticism


@router.put(
    "/asceticisms/{asceticism_id}",
    tags=["asceticisms"],
    response_model=AsceticismResponse,
)
async def update_asceticism(
    asceticism_id: int,
    item: AsceticismCreate,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """Update an existing asceticism template. Admin only."""
    asceticism = session.get(Asceticism, asceticism_id)
    if not asceticism:
        raise HTTPException(status_code=404, detail="Asceticism not found")

    asceticism.title = item.title
    asceticism.category = item.category
    asceticism.type = item.type
    if item.description is not None:
        asceticism.description = item.description
    if item.icon is not None:
        asceticism.icon = item.icon
    if item.custom_metadata is not None:
        asceticism.custom_metadata = item.custom_metadata

    asceticism.updatedAt = datetime.utcnow()

    session.add(asceticism)
    session.commit()
    session.refresh(asceticism)

    return asceticism


@router.delete("/asceticisms/{asceticism_id}", tags=["asceticisms"])
async def delete_asceticism(
    asceticism_id: int,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """Delete an asceticism template. Admin only."""
    asceticism = session.get(Asceticism, asceticism_id)
    if not asceticism:
        raise HTTPException(status_code=404, detail="Asceticism not found")

    # Check if any users are committed to this asceticism
    user_count_stmt = select(func.count(UserAsceticism.id)).where(
        UserAsceticism.asceticismId == asceticism_id
    )
    user_count = session.exec(user_count_stmt).one()
    if user_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete asceticism: {user_count} user(s) are currently committed to it",
        )

    session.delete(asceticism)
    session.commit()
    return {"message": "Asceticism deleted successfully"}


@router.get(
    "/asceticisms/my",
    tags=["asceticisms"],
    response_model=list[UserAsceticismWithDetails],
)
async def list_user_asceticisms(
    user_id: int = Query(..., alias="userId"),
    start_date: Optional[str] = Query(None, alias="startDate"),
    end_date: Optional[str] = Query(None, alias="endDate"),
    include_archived: bool = Query(True, alias="includeArchived"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get all asceticisms for a specific user that overlap with the date range."""
    # Users can only view their own asceticisms unless they're admin
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403, detail="Cannot view another user's asceticisms"
        )
    # Build base query
    statement = select(UserAsceticism).where(UserAsceticism.userId == user_id)

    # Filter by status
    if include_archived:
        statement = statement.where(
            or_(
                UserAsceticism.status == AsceticismStatus.ACTIVE,
                UserAsceticism.status == AsceticismStatus.ARCHIVED,
            )
        )
    else:
        statement = statement.where(UserAsceticism.status == AsceticismStatus.ACTIVE)

    # Filter by date range overlap
    if start_date or end_date:
        query_start = parse_date(start_date) if start_date else None
        query_end = parse_date(end_date) if end_date else None

        conditions = []
        if query_end:
            conditions.append(UserAsceticism.startDate <= query_end)
        if query_start:
            conditions.append(
                or_(
                    UserAsceticism.endDate == None,
                    UserAsceticism.endDate >= query_start,
                )
            )

        if conditions:
            statement = statement.where(and_(*conditions))

    user_asceticisms = session.exec(statement).all()

    # Build response with related data
    result = []
    for ua in user_asceticisms:
        # Get asceticism
        asceticism = session.get(Asceticism, ua.asceticismId)

        # Get logs in date range
        logs_stmt = select(AsceticismLog).where(AsceticismLog.userAsceticismId == ua.id)
        if start_date and end_date:
            logs_start = parse_date(start_date)
            logs_end = parse_date(end_date).replace(hour=23, minute=59, second=59)
            logs_stmt = logs_stmt.where(
                and_(
                    AsceticismLog.date >= logs_start,
                    AsceticismLog.date <= logs_end,
                )
            )
        elif start_date:
            logs_start = parse_date(start_date)
            logs_stmt = logs_stmt.where(AsceticismLog.date >= logs_start)
        elif end_date:
            logs_end = parse_date(end_date).replace(hour=23, minute=59, second=59)
            logs_stmt = logs_stmt.where(AsceticismLog.date <= logs_end)

        logs_stmt = logs_stmt.order_by(AsceticismLog.date.desc())
        logs = session.exec(logs_stmt).all()

        result.append(
            {
                "id": ua.id,
                "userId": ua.userId,
                "asceticismId": ua.asceticismId,
                "status": ua.status.value,
                "startDate": ua.startDate.isoformat(),
                "endDate": ua.endDate.isoformat() if ua.endDate else None,
                "targetValue": ua.targetValue,
                "reminderTime": (
                    ua.reminderTime.isoformat() if ua.reminderTime else None
                ),
                "custom_metadata": ua.custom_metadata,
                "createdAt": ua.createdAt.isoformat(),
                "updatedAt": ua.updatedAt.isoformat(),
                "asceticism": {
                    "id": asceticism.id,
                    "title": asceticism.title,
                    "description": asceticism.description,
                    "category": asceticism.category,
                    "icon": asceticism.icon,
                    "type": asceticism.type.value,
                    "isTemplate": asceticism.isTemplate,
                    "creatorId": asceticism.creatorId,
                    "custom_metadata": asceticism.custom_metadata,
                    "createdAt": asceticism.createdAt.isoformat(),
                    "updatedAt": asceticism.updatedAt.isoformat(),
                },
                "logs": [
                    {
                        "id": log.id,
                        "userAsceticismId": log.userAsceticismId,
                        "date": log.date.isoformat(),
                        "completed": log.completed,
                        "value": log.value,
                        "notes": log.notes,
                        "custom_metadata": log.custom_metadata,
                        "createdAt": log.createdAt.isoformat(),
                        "updatedAt": log.updatedAt.isoformat(),
                    }
                    for log in logs
                ],
            }
        )

    return result


@router.post(
    "/asceticisms/join",
    tags=["asceticisms"],
    response_model=UserAsceticismWithDetails,
)
async def join_asceticism(
    link: UserAsceticismLink,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Subscribe a user to an asceticism."""
    # Users can only join asceticisms for themselves
    if current_user.id != link.userId:
        raise HTTPException(
            status_code=403, detail="Cannot join asceticism for another user"
        )
    # Check if already active
    existing_active_stmt = select(UserAsceticism).where(
        and_(
            UserAsceticism.userId == link.userId,
            UserAsceticism.asceticismId == link.asceticismId,
            UserAsceticism.status == AsceticismStatus.ACTIVE,
        )
    )
    existing_active = session.exec(existing_active_stmt).first()
    if existing_active:
        raise HTTPException(
            status_code=400, detail="You are already tracking this asceticism"
        )

    # Check if there's an archived one we can reactivate
    existing_archived_stmt = select(UserAsceticism).where(
        and_(
            UserAsceticism.userId == link.userId,
            UserAsceticism.asceticismId == link.asceticismId,
            UserAsceticism.status == AsceticismStatus.ARCHIVED,
        )
    )
    existing_archived = session.exec(existing_archived_stmt).first()

    # If archived version exists, reactivate it
    if existing_archived:
        existing_archived.status = AsceticismStatus.ACTIVE
        existing_archived.endDate = None
        existing_archived.startDate = (
            parse_date(link.startDate) if link.startDate else datetime.now(timezone.utc)
        )
        if link.endDate:
            try:
                existing_archived.endDate = parse_date(link.endDate)
            except ValueError:
                pass
        if link.targetValue is not None:
            existing_archived.targetValue = link.targetValue
        existing_archived.updatedAt = datetime.utcnow()

        session.add(existing_archived)
        session.commit()
        session.refresh(existing_archived)

        # Load asceticism
        asceticism = session.get(Asceticism, existing_archived.asceticismId)
        return {
            **existing_archived.model_dump(),
            "asceticism": asceticism.model_dump() if asceticism else None,
        }

    # Create new commitment
    user_asceticism = UserAsceticism(
        userId=link.userId,
        asceticismId=link.asceticismId,
        targetValue=link.targetValue,
        startDate=(
            parse_date(link.startDate) if link.startDate else datetime.now(timezone.utc)
        ),
        endDate=parse_date(link.endDate) if link.endDate else None,
        custom_metadata=link.custom_metadata,
    )

    session.add(user_asceticism)
    session.commit()
    session.refresh(user_asceticism)

    # Load asceticism
    asceticism = session.get(Asceticism, user_asceticism.asceticismId)
    return {
        **user_asceticism.model_dump(),
        "asceticism": asceticism.model_dump() if asceticism else None,
    }


@router.post("/asceticisms/log", tags=["asceticisms"], response_model=LogResponse)
async def log_daily_progress(
    log: LogCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Log progress for a specific day."""
    # Verify the UserAsceticism belongs to the current user
    user_asceticism = session.get(UserAsceticism, log.userAsceticismId)
    if not user_asceticism:
        raise HTTPException(status_code=404, detail="User asceticism not found")

    if user_asceticism.userId != current_user.id:
        raise HTTPException(
            status_code=403, detail="Cannot log progress for another user's asceticism"
        )
    try:
        if "T" not in log.date:
            parsed_date = datetime.strptime(log.date, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
        else:
            parsed_date = datetime.fromisoformat(log.date.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD or ISO datetime.",
        ) from exc

    # Check if log already exists
    existing_log_stmt = select(AsceticismLog).where(
        and_(
            AsceticismLog.userAsceticismId == log.userAsceticismId,
            AsceticismLog.date == parsed_date,
        )
    )
    existing_log = session.exec(existing_log_stmt).first()

    if existing_log:
        # Update existing log
        existing_log.completed = log.completed
        if log.value is not None:
            existing_log.value = log.value
        if log.notes is not None:
            existing_log.notes = log.notes
        if log.custom_metadata is not None:
            existing_log.custom_metadata = log.custom_metadata
        existing_log.updatedAt = datetime.utcnow()

        session.add(existing_log)
        session.commit()
        session.refresh(existing_log)
        return existing_log

    # Create new log
    new_log = AsceticismLog(
        userAsceticismId=log.userAsceticismId,
        date=parsed_date,
        completed=log.completed,
        value=log.value,
        notes=log.notes,
        custom_metadata=log.custom_metadata,
    )

    session.add(new_log)
    session.commit()
    session.refresh(new_log)
    return new_log


@router.delete("/asceticisms/leave/{user_asceticism_id}", tags=["asceticisms"])
async def leave_asceticism(
    user_asceticism_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Leave/remove an asceticism commitment."""
    user_asceticism = session.get(UserAsceticism, user_asceticism_id)
    if not user_asceticism:
        raise HTTPException(status_code=404, detail="User asceticism not found")

    # Users can only leave their own asceticisms
    if user_asceticism.userId != current_user.id:
        raise HTTPException(
            status_code=403, detail="Cannot leave another user's asceticism"
        )

    # Check if there's a log for today
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    today_end = datetime.now(timezone.utc).replace(
        hour=23, minute=59, second=59, microsecond=999999
    )

    today_log_stmt = select(AsceticismLog).where(
        and_(
            AsceticismLog.userAsceticismId == user_asceticism_id,
            AsceticismLog.date >= today_start,
            AsceticismLog.date <= today_end,
        )
    )
    today_log = session.exec(today_log_stmt).first()

    # Set end date based on whether logged today
    if today_log:
        end_date = today_end
    else:
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        end_date = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)

    user_asceticism.status = AsceticismStatus.ARCHIVED
    user_asceticism.endDate = end_date
    user_asceticism.updatedAt = datetime.utcnow()

    session.add(user_asceticism)
    session.commit()

    return {"message": "Successfully left asceticism"}


@router.patch(
    "/asceticisms/my/{user_asceticism_id}",
    tags=["asceticisms"],
    response_model=UserAsceticismWithDetails,
)
async def update_user_asceticism(
    user_asceticism_id: int,
    update: UserAsceticismUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update a user's asceticism commitment."""
    user_asceticism = session.get(UserAsceticism, user_asceticism_id)
    if not user_asceticism:
        raise HTTPException(status_code=404, detail="User asceticism not found")

    # Users can only update their own asceticisms
    if user_asceticism.userId != current_user.id:
        raise HTTPException(
            status_code=403, detail="Cannot update another user's asceticism"
        )

    if update.startDate is not None:
        try:
            user_asceticism.startDate = parse_date(update.startDate)
        except ValueError as exc:
            raise HTTPException(
                status_code=400, detail="Invalid startDate format"
            ) from exc

    if update.endDate is not None:
        try:
            user_asceticism.endDate = parse_date(update.endDate)
        except ValueError as exc:
            raise HTTPException(
                status_code=400, detail="Invalid endDate format"
            ) from exc

    if update.targetValue is not None:
        user_asceticism.targetValue = update.targetValue

    if update.status is not None:
        user_asceticism.status = update.status

    user_asceticism.updatedAt = datetime.utcnow()

    session.add(user_asceticism)
    session.commit()
    session.refresh(user_asceticism)

    # Load asceticism
    asceticism = session.get(Asceticism, user_asceticism.asceticismId)
    return {
        **user_asceticism.model_dump(),
        "asceticism": asceticism.model_dump() if asceticism else None,
    }


@router.get(
    "/asceticisms/progress",
    tags=["asceticisms"],
    response_model=list[AsceticismProgressResponse],
)
async def get_user_progress(
    user_id: int = Query(..., alias="userId"),
    start_date: str = Query(..., alias="startDate"),
    end_date: str = Query(..., alias="endDate"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get progress statistics for all user asceticisms within a date range."""
    # Users can only view their own progress unless they're admin
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403, detail="Cannot view another user's progress"
        )
    start = parse_date(start_date)
    end = parse_date(end_date).replace(hour=23, minute=59, second=59)

    # Get all active user asceticisms
    statement = select(UserAsceticism).where(
        and_(
            UserAsceticism.userId == user_id,
            UserAsceticism.status == AsceticismStatus.ACTIVE,
        )
    )
    user_asceticisms = session.exec(statement).all()

    progress_data = []
    for ua in user_asceticisms:
        asceticism = session.get(Asceticism, ua.asceticismId)
        if not asceticism:
            continue

        # Get logs in date range
        logs_stmt = (
            select(AsceticismLog)
            .where(
                and_(
                    AsceticismLog.userAsceticismId == ua.id,
                    AsceticismLog.date >= start,
                    AsceticismLog.date <= end,
                )
            )
            .order_by(AsceticismLog.date.asc())
        )
        logs = session.exec(logs_stmt).all()

        # Calculate statistics
        total_days = (end - start).days + 1
        completed_days = sum(1 for log in logs if log.completed)
        completion_rate = (completed_days / total_days * 100) if total_days > 0 else 0

        # Calculate current streak
        current_streak = 0
        sorted_logs = sorted(logs, key=lambda x: x.date, reverse=True)
        for log in sorted_logs:
            if log.completed:
                current_streak += 1
            else:
                break

        # Calculate longest streak
        longest_streak = 0
        temp_streak = 0
        for log in sorted(logs, key=lambda x: x.date):
            if log.completed:
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 0

        progress_data.append(
            {
                "userAsceticismId": ua.id,
                "asceticism": {
                    "id": asceticism.id,
                    "title": asceticism.title,
                    "category": asceticism.category,
                    "icon": asceticism.icon,
                    "type": asceticism.type.value,
                },
                "startDate": ua.startDate.isoformat(),
                "stats": {
                    "totalDays": total_days,
                    "completedDays": completed_days,
                    "completionRate": round(completion_rate, 1),
                    "currentStreak": current_streak,
                    "longestStreak": longest_streak,
                },
                "logs": [
                    {
                        "date": log.date.isoformat(),
                        "completed": log.completed,
                        "value": log.value,
                        "notes": log.notes,
                    }
                    for log in logs
                ],
            }
        )

    return progress_data


# Debug endpoint removed for security - use proper authentication flow
