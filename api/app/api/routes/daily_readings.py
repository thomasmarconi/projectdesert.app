"""Daily readings router for Catholic Mass readings and notes."""

from typing import Optional
from datetime import datetime, timezone
import httpx
import re
import json
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.auth import get_current_user
from app.models import MassReading, DailyReadingNote, User, UserRole
from app.schemas.daily_readings import (
    DailyReadingNoteCreate,
    DailyReadingNoteUpdate,
    DailyReadingNoteResponse,
    MassReadingResponse,
)

router = APIRouter(prefix="/daily-readings", tags=["daily-readings"])


@router.get("/readings/{date}", response_model=MassReadingResponse)
async def get_mass_readings(date: str, session: Session = Depends(get_session)):
    """
    Get Mass readings for a specific date. Checks database cache first,
    then fetches from Universalis API if not cached.
    Date should be in YYYYMMDD format (e.g., 20260105).
    """
    try:
        # Parse date string to datetime (YYYYMMDD -> datetime)
        year = int(date[:4])
        month = int(date[4:6])
        day = int(date[6:8])
        date_obj = datetime(year, month, day, tzinfo=timezone.utc)

        # Check if readings exist in database
        statement = select(MassReading).where(MassReading.date == date_obj)
        cached_reading = session.exec(statement).first()

        if cached_reading:
            # Return cached readings from database
            return cached_reading.data

        # Not in cache, fetch from Universalis API
        url = f"https://www.universalis.com/usa/{date}/jsonpmass.js"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()

            # Get the JSONP response
            body = response.text

            # Strip JSONP wrapper: universalisCallback(...);
            json_str = re.sub(r"^universalisCallback\(", "", body)
            json_str = re.sub(r"\);\s*$", "", json_str)

            # Parse the JSON
            data = json.loads(json_str)

            # Store in database for future requests
            mass_reading = MassReading(date=date_obj, data=data)
            session.add(mass_reading)
            session.commit()

            return data

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502, detail=f"Failed to fetch readings: {str(e)}"
        ) from e
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502, detail=f"Failed to parse readings: {str(e)}"
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=400, detail=f"Invalid date format: {str(e)}"
        ) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/notes", response_model=DailyReadingNoteResponse)
async def create_or_update_note(
    data: DailyReadingNoteCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create or update a daily reading note for a user on a specific date."""
    # Users can only create/update their own notes
    if current_user.id != data.userId:
        raise HTTPException(
            status_code=403, detail="Cannot create note for another user"
        )
    try:
        # Parse the date string and normalize to midnight UTC
        date_obj = datetime.fromisoformat(data.date.replace("Z", "+00:00"))
        normalized_date = date_obj.replace(
            hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc
        )

        # Check if a note already exists for this user and date
        statement = select(DailyReadingNote).where(
            DailyReadingNote.userId == data.userId,
            DailyReadingNote.date == normalized_date,
        )
        existing_note = session.exec(statement).first()

        if existing_note:
            # Update existing note
            existing_note.notes = data.notes
            existing_note.updatedAt = datetime.utcnow()
            session.add(existing_note)
            session.commit()
            session.refresh(existing_note)

            return DailyReadingNoteResponse(
                id=existing_note.id,
                userId=existing_note.userId,
                date=existing_note.date.isoformat(),
                notes=existing_note.notes,
                createdAt=existing_note.createdAt.isoformat(),
                updatedAt=existing_note.updatedAt.isoformat(),
            )
        else:
            # Create new note
            new_note = DailyReadingNote(
                userId=data.userId,
                date=normalized_date,
                notes=data.notes,
            )
            session.add(new_note)
            session.commit()
            session.refresh(new_note)

            return DailyReadingNoteResponse(
                id=new_note.id,
                userId=new_note.userId,
                date=new_note.date.isoformat(),
                notes=new_note.notes,
                createdAt=new_note.createdAt.isoformat(),
                updatedAt=new_note.updatedAt.isoformat(),
            )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notes/{user_id}/{date}", response_model=DailyReadingNoteResponse)
async def get_note_by_date(
    user_id: int,
    date: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Get a user's daily reading note for a specific date.
    Returns 404 if no note exists for that date.
    """
    # Users can only view their own notes unless they're admin
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot view another user's notes")
    try:
        # Parse and normalize the date
        date_obj = datetime.fromisoformat(date.replace("Z", "+00:00"))
        normalized_date = date_obj.replace(
            hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc
        )

        statement = select(DailyReadingNote).where(
            DailyReadingNote.userId == user_id,
            DailyReadingNote.date == normalized_date,
        )
        note = session.exec(statement).first()

        if not note:
            raise HTTPException(status_code=404, detail="No note found for this date")

        return DailyReadingNoteResponse(
            id=note.id,
            userId=note.userId,
            date=note.date.isoformat(),
            notes=note.notes,
            createdAt=note.createdAt.isoformat(),
            updatedAt=note.updatedAt.isoformat(),
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notes/{user_id}", response_model=list[DailyReadingNoteResponse])
async def get_all_user_notes(
    user_id: int,
    limit: Optional[int] = 30,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get all daily reading notes for a user, ordered by date descending."""
    # Users can only view their own notes unless they're admin
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot view another user's notes")
    try:
        statement = (
            select(DailyReadingNote)
            .where(DailyReadingNote.userId == user_id)
            .order_by(DailyReadingNote.date.desc())
            .limit(limit)
        )
        notes = session.exec(statement).all()

        return [
            DailyReadingNoteResponse(
                id=note.id,
                userId=note.userId,
                date=note.date.isoformat(),
                notes=note.notes,
                createdAt=note.createdAt.isoformat(),
                updatedAt=note.updatedAt.isoformat(),
            )
            for note in notes
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/notes/{note_id}")
async def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a daily reading note by ID."""
    try:
        note = session.get(DailyReadingNote, note_id)

        if not note:
            raise HTTPException(status_code=404, detail="Note not found")

        # Users can only delete their own notes
        if note.userId != current_user.id:
            raise HTTPException(
                status_code=403, detail="Cannot delete another user's note"
            )

        session.delete(note)
        session.commit()

        return {"message": "Note deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
