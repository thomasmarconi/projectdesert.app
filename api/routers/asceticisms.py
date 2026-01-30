from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from prisma.models import Asceticism, UserAsceticism, AsceticismLog
from prisma.enums import TrackingType, AsceticismStatus
from ..db import db

router = APIRouter()

# --- Pydantic Models for Inputs ---


class AsceticismCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    icon: Optional[str] = None
    type: TrackingType = TrackingType.BOOLEAN
    metadata: Optional[dict] = None
    creatorId: Optional[int] = None


class UserAsceticismLink(BaseModel):
    userId: int
    asceticismId: int
    targetValue: Optional[float] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    metadata: Optional[dict] = None


class LogCreate(BaseModel):
    userAsceticismId: int
    date: str  # ISO Date
    completed: bool = False
    value: Optional[float] = None
    notes: Optional[str] = None
    metadata: Optional[dict] = None


class LogUpdate(BaseModel):
    value: Optional[float] = None
    notes: Optional[str] = None
    completed: Optional[bool] = None
    metadata: Optional[dict] = None


class UserAsceticismUpdate(BaseModel):
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    targetValue: Optional[float] = None
    status: Optional[AsceticismStatus] = None


# --- Routes ---


@router.get("/asceticisms/", tags=["asceticisms"], response_model=List[Asceticism])
async def list_asceticisms(category: Optional[str] = None):
    """
    List all available asceticism templates (isTemplate=True).
    """
    where: dict = {"isTemplate": True}
    if category:
        where["category"] = category

    return await db.asceticism.find_many(where=where)  # type: ignore


@router.post("/asceticisms/", tags=["asceticisms"], response_model=Asceticism)
async def create_asceticism(item: AsceticismCreate):
    """
    Create a new asceticism. If creatorId is provided, it's a custom user asceticism.
    Otherwise it expects admin access (logic not implemented yet), defaulting to template.
    """
    is_template = item.creatorId is None

    # helper to filter out None values to let Prisma handle nulls/defaults gracefully
    data: dict = {
        "title": item.title,
        "category": item.category,
        "type": item.type,
        "isTemplate": is_template,
    }

    if item.description is not None:
        data["description"] = item.description
    if item.icon is not None:
        data["icon"] = item.icon
    if item.metadata is not None:
        data["metadata"] = item.metadata
    if item.creatorId is not None:
        data["creatorId"] = item.creatorId

    return await db.asceticism.create(data=data)  # type: ignore


@router.put(
    "/asceticisms/{asceticism_id}", tags=["asceticisms"], response_model=Asceticism
)
async def update_asceticism(asceticism_id: int, item: AsceticismCreate):
    """
    Update an existing asceticism template.
    TODO: Add admin permission check.
    """
    # Check if asceticism exists
    existing = await db.asceticism.find_unique(where={"id": asceticism_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Asceticism not found")

    # Prepare update data
    data: dict = {
        "title": item.title,
        "category": item.category,
        "type": item.type,
    }

    if item.description is not None:
        data["description"] = item.description
    if item.icon is not None:
        data["icon"] = item.icon
    if item.metadata is not None:
        data["metadata"] = item.metadata

    return await db.asceticism.update(where={"id": asceticism_id}, data=data)  # type: ignore


@router.delete("/asceticisms/{asceticism_id}", tags=["asceticisms"])
async def delete_asceticism(asceticism_id: int):
    """
    Delete an asceticism template.
    TODO: Add admin permission check.
    Note: This will fail if users are currently committed to this asceticism due to foreign key constraints.
    """
    # Check if asceticism exists
    existing = await db.asceticism.find_unique(where={"id": asceticism_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Asceticism not found")

    # Check if any users are committed to this asceticism
    user_count = await db.userasceticism.count(where={"asceticismId": asceticism_id})
    if user_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete asceticism: {user_count} user(s) are currently committed to it",
        )

    await db.asceticism.delete(where={"id": asceticism_id})
    return {"message": "Asceticism deleted successfully"}


@router.get(
    "/asceticisms/my", tags=["asceticisms"], response_model=List[UserAsceticism]
)
async def list_user_asceticisms(
    user_id: int = Query(..., alias="userId"),
    start_date: Optional[str] = Query(None, alias="startDate"),
    end_date: Optional[str] = Query(None, alias="endDate"),
    include_archived: bool = Query(True, alias="includeArchived"),
):
    """
    Get all asceticisms for a specific user that overlap with the date range.
    Includes archived asceticisms by default to show historical data.
    """
    from datetime import timezone

    # Parse dates to datetime objects
    def parse_date(date_str: str) -> datetime:
        """Parse YYYY-MM-DD or ISO datetime string to datetime"""
        if "T" not in date_str:
            # Just a date, parse as start of day
            return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        else:
            # ISO datetime
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))

    # Build where clause - include both ACTIVE and ARCHIVED by default
    where_clause: dict = {
        "userId": user_id,
    }

    # Filter by status if needed
    if include_archived:
        where_clause["status"] = {
            "in": [AsceticismStatus.ACTIVE, AsceticismStatus.ARCHIVED]
        }
    else:
        where_clause["status"] = AsceticismStatus.ACTIVE

    # If dates provided, filter by date range overlap
    if start_date or end_date:
        query_start = parse_date(start_date) if start_date else None
        query_end = parse_date(end_date) if end_date else None

        # Show asceticism if it was active during the date range
        # Active means: started before/at the range end AND (no end date OR ended after/at the range start)
        if query_end:
            where_clause["startDate"] = {"lte": query_end}
        if query_start:
            where_clause["OR"] = [{"endDate": None}, {"endDate": {"gte": query_start}}]

    # Build logs filter for the specific date range
    logs_where = {}
    if start_date and end_date:
        logs_start = parse_date(start_date)
        logs_end = parse_date(end_date).replace(hour=23, minute=59, second=59)
        logs_where["date"] = {"gte": logs_start, "lte": logs_end}
    elif start_date:
        logs_start = parse_date(start_date)
        logs_where["date"] = {"gte": logs_start}
    elif end_date:
        logs_end = parse_date(end_date).replace(hour=23, minute=59, second=59)
        logs_where["date"] = {"lte": logs_end}

    return await db.userasceticism.find_many(
        where=where_clause,  # type: ignore
        include={  # type: ignore
            "asceticism": True,
            "logs": {
                "where": logs_where if logs_where else {},
                "order_by": {"date": "desc"},
            },
        },
    )


@router.post("/asceticisms/join", tags=["asceticisms"], response_model=UserAsceticism)
async def join_asceticism(link: UserAsceticismLink):
    """
    Subscribe a user to an asceticism.
    If previously archived, reactivates it. Otherwise creates new commitment.
    """
    from datetime import timezone

    # Check if already active
    existing_active = await db.userasceticism.find_first(
        where={
            "userId": link.userId,
            "asceticismId": link.asceticismId,
            "status": AsceticismStatus.ACTIVE,
        }
    )
    if existing_active:
        raise HTTPException(
            status_code=400, detail="You are already tracking this asceticism"
        )

    # Check if there's an archived one we can reactivate
    existing_archived = await db.userasceticism.find_first(
        where={
            "userId": link.userId,
            "asceticismId": link.asceticismId,
            "status": AsceticismStatus.ARCHIVED,
        }
    )

    # Parse dates
    def parse_date(date_str: str) -> datetime:
        """Parse YYYY-MM-DD or ISO datetime string to datetime"""
        if "T" not in date_str:
            return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        else:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))

    # If archived version exists, reactivate it
    if existing_archived:
        update_data: dict = {
            "status": AsceticismStatus.ACTIVE,
            "endDate": None,  # Clear end date
        }

        if link.startDate is not None:
            try:
                update_data["startDate"] = parse_date(link.startDate)
            except ValueError:
                update_data["startDate"] = datetime.now(timezone.utc)
        else:
            update_data["startDate"] = datetime.now(timezone.utc)

        if link.endDate is not None:
            try:
                update_data["endDate"] = parse_date(link.endDate)
            except ValueError:
                pass

        if link.targetValue is not None:
            update_data["targetValue"] = link.targetValue

        return await db.userasceticism.update(
            where={"id": existing_archived.id},
            data=update_data,
            include={"asceticism": True},  # type: ignore
        )

    # Otherwise create new commitment
    data: dict = {
        "user": {"connect": {"id": link.userId}},
        "asceticism": {"connect": {"id": link.asceticismId}},
    }

    if link.targetValue is not None:
        data["targetValue"] = link.targetValue

    if link.startDate is not None:
        try:
            data["startDate"] = parse_date(link.startDate)
        except ValueError:
            data["startDate"] = datetime.now(timezone.utc)

    if link.endDate is not None:
        try:
            data["endDate"] = parse_date(link.endDate)
        except ValueError:
            pass

    if link.metadata is not None:
        data["metadata"] = link.metadata

    return await db.userasceticism.create(data=data, include={"asceticism": True})  # type: ignore


@router.post("/asceticisms/log", tags=["asceticisms"], response_model=AsceticismLog)
async def log_daily_progress(log: LogCreate):
    """
    Log progress for a specific day. Upserts (updates if exists).
    """
    # Parse date string to datetime object (accepts YYYY-MM-DD or ISO datetime)
    try:
        # If it's just a date (YYYY-MM-DD), convert to start of day
        if "T" not in log.date:
            parsed_date = datetime.strptime(log.date, "%Y-%m-%d")
        else:
            # Already an ISO datetime string, parse it
            parsed_date = datetime.fromisoformat(log.date.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD or ISO datetime.",
        ) from exc

    # Prepare update data (no relations needed here usually, just scalars)
    update_data: dict = {"completed": log.completed}
    if log.value is not None:
        update_data["value"] = log.value
    if log.notes is not None:
        update_data["notes"] = log.notes
    if log.metadata is not None:
        update_data["metadata"] = log.metadata

    # Prepare create data (requires relation connection)
    create_data: dict = {
        "userAsceticism": {"connect": {"id": log.userAsceticismId}},
        "date": parsed_date,
        "completed": log.completed,
    }
    if log.value is not None:
        create_data["value"] = log.value
    if log.notes is not None:
        create_data["notes"] = log.notes
    if log.metadata is not None:
        create_data["metadata"] = log.metadata

    return await db.asceticismlog.upsert(
        where={  # type: ignore
            "userAsceticismId_date": {
                "userAsceticismId": log.userAsceticismId,
                "date": parsed_date,
            }
        },
        data={"create": create_data, "update": update_data},  # type: ignore
    )


@router.delete("/asceticisms/leave/{user_asceticism_id}", tags=["asceticisms"])
async def leave_asceticism(user_asceticism_id: int):
    """
    Leave/remove an asceticism commitment.
    - If logged today: Sets endDate to end of today (keeps today's log visible)
    - If not logged today: Sets endDate to yesterday (removes from today)
    This preserves all historical data.
    """
    from datetime import timezone, timedelta

    # Check if the user asceticism exists
    user_asceticism = await db.userasceticism.find_unique(
        where={"id": user_asceticism_id}
    )

    if not user_asceticism:
        raise HTTPException(status_code=404, detail="User asceticism not found")

    # Check if there's a log for today
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    today_end = datetime.now(timezone.utc).replace(
        hour=23, minute=59, second=59, microsecond=999999
    )

    today_log = await db.asceticismlog.find_first(
        where={
            "userAsceticismId": user_asceticism_id,
            "date": {"gte": today_start, "lte": today_end},
        }
    )

    # If logged today, set endDate to end of today. Otherwise, end of yesterday.
    if today_log:
        end_date = today_end
    else:
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        end_date = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Update status to ARCHIVED and set endDate
    await db.userasceticism.update(
        where={"id": user_asceticism_id},
        data={"status": AsceticismStatus.ARCHIVED, "endDate": end_date},
    )

    return {"message": "Successfully left asceticism"}


@router.patch(
    "/asceticisms/my/{user_asceticism_id}",
    tags=["asceticisms"],
    response_model=UserAsceticism,
)
async def update_user_asceticism(user_asceticism_id: int, update: UserAsceticismUpdate):
    """
    Update a user's asceticism commitment (dates, target value, or status).
    """
    from datetime import timezone

    # Check if the user asceticism exists
    user_asceticism = await db.userasceticism.find_unique(
        where={"id": user_asceticism_id}
    )

    if not user_asceticism:
        raise HTTPException(status_code=404, detail="User asceticism not found")

    # Helper to parse dates
    def parse_date(date_str: str) -> datetime:
        """Parse YYYY-MM-DD or ISO datetime string to datetime"""
        if "T" not in date_str:
            return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        else:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))

    # Prepare update data
    data: dict = {}
    if update.startDate is not None:
        try:
            data["startDate"] = parse_date(update.startDate)
        except ValueError as exc:
            raise HTTPException(
                status_code=400, detail="Invalid startDate format"
            ) from exc

    if update.endDate is not None:
        try:
            data["endDate"] = parse_date(update.endDate)
        except ValueError as exc:
            raise HTTPException(
                status_code=400, detail="Invalid endDate format"
            ) from exc

    if update.targetValue is not None:
        data["targetValue"] = update.targetValue

    if update.status is not None:
        data["status"] = update.status

    # Update the user asceticism
    return await db.userasceticism.update(
        where={"id": user_asceticism_id}, data=data, include={"asceticism": True}  # type: ignore
    )


@router.get("/asceticisms/progress", tags=["asceticisms"])
async def get_user_progress(
    user_id: int = Query(..., alias="userId"),
    start_date: str = Query(..., alias="startDate"),
    end_date: str = Query(..., alias="endDate"),
):
    """
    Get progress statistics for all user asceticisms within a date range.
    Returns completion rates, streaks, and detailed logs.
    """
    from datetime import timezone

    # Helper to parse dates
    def parse_date(date_str: str) -> datetime:
        """Parse YYYY-MM-DD or ISO datetime string to datetime"""
        if "T" not in date_str:
            return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        else:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))

    # Parse the date range
    start = parse_date(start_date)
    end = parse_date(end_date).replace(hour=23, minute=59, second=59)

    # Get all active user asceticisms
    user_asceticisms = await db.userasceticism.find_many(
        where={"userId": user_id, "status": AsceticismStatus.ACTIVE},
        include={  # type: ignore
            "asceticism": True,
            "logs": {
                "where": {"date": {"gte": start, "lte": end}},
                "order_by": {"date": "asc"},
            },
        },
    )

    # Calculate statistics for each asceticism
    progress_data = []
    for ua in user_asceticisms:
        # Ensure asceticism data is loaded
        if not ua.asceticism:
            continue

        logs = ua.logs or []

        # Calculate total days in range
        total_days = (end - start).days + 1

        # Calculate completion stats
        completed_days = sum(1 for log in logs if log.completed)
        completion_rate = (completed_days / total_days * 100) if total_days > 0 else 0

        # Calculate current streak
        current_streak = 0
        if logs:
            sorted_logs = sorted(logs, key=lambda x: x.date, reverse=True)
            for log in sorted_logs:
                if log.completed:
                    current_streak += 1
                else:
                    break

        # Calculate longest streak in period
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
                    "id": ua.asceticism.id,
                    "title": ua.asceticism.title,
                    "category": ua.asceticism.category,
                    "icon": ua.asceticism.icon,
                    "type": ua.asceticism.type,
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


@router.post("/debug/user")
async def create_debug_user(email: str):
    return await db.user.create(data={"email": email, "name": "Debug User"})
