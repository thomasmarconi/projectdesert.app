"""Pydantic schemas for asceticism endpoints."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, model_validator
from ..models import TrackingType, AsceticismStatus


def parse_date(date_str: Optional[str]) -> Optional[datetime]:
    """Parse a date string to datetime."""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except ValueError:
        return datetime.strptime(date_str, "%Y-%m-%d")


class DateRangeValidatorMixin(BaseModel):
    """Mixin that validates startDate comes before endDate."""

    startDate: Optional[str] = None
    endDate: Optional[str] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.startDate and self.endDate:
            start = parse_date(self.startDate)
            end = parse_date(self.endDate)
            if start and end and end < start:
                raise ValueError("End date cannot be before start date")
        return self


class AsceticismCreate(BaseModel):
    """Request to create an asceticism."""

    title: str
    description: Optional[str] = None
    category: str
    icon: Optional[str] = None
    type: TrackingType = TrackingType.BOOLEAN
    custom_metadata: Optional[dict] = None
    creatorId: Optional[int] = None


class AsceticismResponse(BaseModel):
    """Asceticism response."""

    id: int
    title: str
    description: Optional[str]
    category: str
    icon: Optional[str]
    type: TrackingType
    isTemplate: bool
    creatorId: Optional[int]
    custom_metadata: Optional[dict]
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class UserAsceticismLink(DateRangeValidatorMixin):
    """Request to link user to asceticism."""

    userId: int
    asceticismId: int
    targetValue: Optional[float] = None
    custom_metadata: Optional[dict] = None


class UserAsceticismResponse(BaseModel):
    """User asceticism response."""

    id: int
    userId: int
    asceticismId: int
    status: AsceticismStatus
    startDate: datetime
    endDate: Optional[datetime]
    targetValue: Optional[float]
    reminderTime: Optional[datetime]
    custom_metadata: Optional[dict]
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class UserAsceticismUpdate(DateRangeValidatorMixin):
    """Request to update user asceticism."""

    targetValue: Optional[float] = None
    status: Optional[AsceticismStatus] = None


class LogCreate(BaseModel):
    """Request to create asceticism log."""

    userAsceticismId: int
    date: str
    completed: bool = False
    value: Optional[float] = None
    notes: Optional[str] = None
    custom_metadata: Optional[dict] = None


class LogUpdate(BaseModel):
    """Request to update asceticism log."""

    value: Optional[float] = None
    notes: Optional[str] = None
    completed: Optional[bool] = None
    custom_metadata: Optional[dict] = None


class LogResponse(BaseModel):
    """Asceticism log response."""

    id: int
    userAsceticismId: int
    date: datetime
    completed: bool
    value: Optional[float]
    notes: Optional[str]
    custom_metadata: Optional[dict]
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}
