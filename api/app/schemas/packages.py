"""Pydantic schemas for package endpoints."""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class PackageItemInput(BaseModel):
    """Package item input."""

    asceticismId: int
    order: int = 0
    notes: Optional[str] = None


class PackageCreate(BaseModel):
    """Request to create a package."""

    title: str
    description: Optional[str] = None
    custom_metadata: Optional[dict] = None
    items: List[PackageItemInput]


class PackageUpdate(BaseModel):
    """Request to update a package."""

    title: Optional[str] = None
    description: Optional[str] = None
    custom_metadata: Optional[dict] = None
    items: Optional[List[PackageItemInput]] = None


class AsceticismInfo(BaseModel):
    """Asceticism information for package items."""

    id: int
    title: str
    description: Optional[str]
    category: str
    icon: Optional[str]
    type: str

    model_config = {"from_attributes": True}


class PackageItemResponse(BaseModel):
    """Package item response."""

    id: int
    asceticismId: int
    order: int
    notes: Optional[str]
    asceticism: AsceticismInfo

    model_config = {"from_attributes": True}


class AddPackageToAccountRequest(BaseModel):
    """Request to add package to user account."""

    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None


class PackageResponse(BaseModel):
    """Package response."""

    id: int
    title: str
    description: Optional[str]
    creatorId: int
    isPublished: bool
    custom_metadata: Optional[dict]
    createdAt: datetime
    updatedAt: datetime
    items: List[PackageItemResponse]
    itemCount: int

    model_config = {"from_attributes": True}
