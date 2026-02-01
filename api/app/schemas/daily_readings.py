"""Pydantic schemas for daily readings endpoints."""

from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel


class DailyReadingNoteCreate(BaseModel):
    """Request to create or update a daily reading note."""

    userId: int
    date: str
    notes: str


class DailyReadingNoteUpdate(BaseModel):
    """Request to update a daily reading note."""

    notes: str


class DailyReadingNoteResponse(BaseModel):
    """Daily reading note response."""

    id: int
    userId: int
    date: str
    notes: str
    createdAt: str
    updatedAt: str


class ReadingText(BaseModel):
    """Text content of a liturgical reading."""

    text: str
    source: Optional[str] = None
    heading: Optional[str] = None


class MassReadingResponse(BaseModel):
    """Mass readings response from Universalis API."""

    Mass_G: Optional[ReadingText] = None  # Gospel
    Mass_R1: Optional[ReadingText] = None  # First Reading
    Mass_R2: Optional[ReadingText] = None  # Second Reading
    Mass_Ps: Optional[ReadingText] = None  # Responsorial Psalm
    Mass_GA: Optional[ReadingText] = None  # Gospel Acclamation
    copyright: Optional[ReadingText] = None
    day: Optional[str] = None
    date: Optional[str] = None
    number: Optional[int] = None

    class Config:
        extra = "allow"  # Allow additional fields from API
