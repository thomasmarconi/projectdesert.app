from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from prisma.models import (
    AsceticismPackage,
    PackageItem,
    User,
    Asceticism,
    UserAsceticism,
)
from prisma.enums import UserRole, AsceticismStatus
from ..db import db

router = APIRouter(prefix="/packages", tags=["packages"])

# --- Pydantic Models ---


class PackageItemInput(BaseModel):
    asceticismId: int
    order: int = 0
    notes: Optional[str] = None


class PackageCreate(BaseModel):
    title: str
    description: Optional[str] = None
    metadata: Optional[dict] = None
    items: List[PackageItemInput]


class PackageUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[dict] = None
    items: Optional[List[PackageItemInput]] = None


class AsceticismInfo(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: str
    icon: Optional[str]
    type: str


class PackageItemResponse(BaseModel):
    id: int
    asceticismId: int
    order: int
    notes: Optional[str]
    asceticism: AsceticismInfo


class PackageResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    creatorId: int
    isPublished: bool
    metadata: Optional[dict]
    createdAt: str
    updatedAt: str
    items: List[PackageItemResponse]
    itemCount: int


# --- Helper Functions ---


async def get_user_by_email(email: str) -> Optional[User]:
    """Get user by email"""
    return await db.user.find_unique(where={"email": email})


async def require_admin(user_email: Optional[str]) -> User:
    """Verify that the user is an admin"""
    if not user_email:
        raise HTTPException(status_code=401, detail="Unauthorized: Not logged in")

    user = await get_user_by_email(user_email)

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized: User not found")

    if user.isBanned:
        raise HTTPException(status_code=403, detail="Unauthorized: User is banned")

    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403, detail="Unauthorized: Admin access required"
        )

    return user


async def require_authenticated_user(user_email: Optional[str]) -> User:
    """Verify that the user is authenticated"""
    if not user_email:
        raise HTTPException(status_code=401, detail="Unauthorized: Not logged in")

    user = await get_user_by_email(user_email)

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized: User not found")

    if user.isBanned:
        raise HTTPException(status_code=403, detail="Unauthorized: User is banned")

    return user


# --- Admin Routes ---


@router.post("/", response_model=PackageResponse)
async def create_package(
    package_data: PackageCreate, x_user_email: Optional[str] = Header(None)
):
    """
    Create a new asceticism package (admin only).
    """
    user = await require_admin(x_user_email)

    # Create the package
    package = await db.asceticismpackage.create(
        data={
            "title": package_data.title,
            "description": package_data.description,
            "creatorId": user.id,
            "metadata": package_data.metadata,
            "isPublished": False,
        }
    )

    # Create package items
    items = []
    for item_data in package_data.items:
        # Verify asceticism exists
        asceticism = await db.asceticism.find_unique(
            where={"id": item_data.asceticismId}
        )
        if not asceticism:
            # Cleanup: delete the package if an asceticism doesn't exist
            await db.asceticismpackage.delete(where={"id": package.id})
            raise HTTPException(
                status_code=404, detail=f"Asceticism {item_data.asceticismId} not found"
            )

        item = await db.packageitem.create(
            data={
                "packageId": package.id,
                "asceticismId": item_data.asceticismId,
                "order": item_data.order,
                "notes": item_data.notes,
            }
        )
        items.append(item)

    # Fetch complete package with items
    complete_package = await db.asceticismpackage.find_unique(
        where={"id": package.id},
        include={
            "items": {"include": {"asceticism": True}, "order_by": {"order": "asc"}}
        },
    )

    return format_package_response(complete_package)


@router.get("/admin/all", response_model=List[PackageResponse])
async def get_all_packages_admin(x_user_email: Optional[str] = Header(None)):
    """
    Get all packages including unpublished ones (admin only).
    """
    await require_admin(x_user_email)

    packages = await db.asceticismpackage.find_many(
        include={
            "items": {"include": {"asceticism": True}, "order_by": {"order": "asc"}}
        },
        order={"createdAt": "desc"},
    )

    return [format_package_response(pkg) for pkg in packages]


@router.put("/{package_id}", response_model=PackageResponse)
async def update_package(
    package_id: int,
    package_data: PackageUpdate,
    x_user_email: Optional[str] = Header(None),
):
    """
    Update a package (admin only).
    """
    await require_admin(x_user_email)

    # Check if package exists
    package = await db.asceticismpackage.find_unique(where={"id": package_id})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    # Build update data
    update_data = {}
    if package_data.title is not None:
        update_data["title"] = package_data.title
    if package_data.description is not None:
        update_data["description"] = package_data.description
    if package_data.metadata is not None:
        update_data["metadata"] = package_data.metadata

    # Update package
    if update_data:
        await db.asceticismpackage.update(where={"id": package_id}, data=update_data)

    # Update items if provided
    if package_data.items is not None:
        # Delete existing items
        await db.packageitem.delete_many(where={"packageId": package_id})

        # Create new items
        for item_data in package_data.items:
            # Verify asceticism exists
            asceticism = await db.asceticism.find_unique(
                where={"id": item_data.asceticismId}
            )
            if not asceticism:
                raise HTTPException(
                    status_code=404,
                    detail=f"Asceticism {item_data.asceticismId} not found",
                )

            await db.packageitem.create(
                data={
                    "packageId": package_id,
                    "asceticismId": item_data.asceticismId,
                    "order": item_data.order,
                    "notes": item_data.notes,
                }
            )

    # Fetch updated package
    complete_package = await db.asceticismpackage.find_unique(
        where={"id": package_id},
        include={
            "items": {"include": {"asceticism": True}, "order_by": {"order": "asc"}}
        },
    )

    return format_package_response(complete_package)


@router.post("/{package_id}/publish")
async def publish_package(package_id: int, x_user_email: Optional[str] = Header(None)):
    """
    Publish or unpublish a package (admin only).
    """
    await require_admin(x_user_email)

    package = await db.asceticismpackage.find_unique(where={"id": package_id})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    # Toggle published status
    updated = await db.asceticismpackage.update(
        where={"id": package_id}, data={"isPublished": not package.isPublished}
    )

    return {"success": True, "isPublished": updated.isPublished}


@router.delete("/{package_id}")
async def delete_package(package_id: int, x_user_email: Optional[str] = Header(None)):
    """
    Delete a package (admin only).
    """
    await require_admin(x_user_email)

    package = await db.asceticismpackage.find_unique(where={"id": package_id})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    # Items will be deleted automatically due to CASCADE
    await db.asceticismpackage.delete(where={"id": package_id})

    return {"success": True, "message": "Package deleted"}


# --- User Routes ---


@router.get("/browse", response_model=List[PackageResponse])
async def browse_published_packages():
    """
    Get all published packages (available to all users).
    """
    packages = await db.asceticismpackage.find_many(
        where={"isPublished": True},
        include={
            "items": {"include": {"asceticism": True}, "order_by": {"order": "asc"}}
        },
        order={"createdAt": "desc"},
    )

    return [format_package_response(pkg) for pkg in packages]


@router.get("/{package_id}", response_model=PackageResponse)
async def get_package_details(package_id: int):
    """
    Get details of a specific published package.
    """
    package = await db.asceticismpackage.find_unique(
        where={"id": package_id},
        include={
            "items": {"include": {"asceticism": True}, "order_by": {"order": "asc"}}
        },
    )

    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    if not package.isPublished:
        raise HTTPException(status_code=403, detail="Package is not published")

    return format_package_response(package)


@router.post("/{package_id}/add-to-account")
async def add_package_to_account(
    package_id: int, x_user_email: Optional[str] = Header(None)
):
    """
    Add all asceticisms from a package to the user's account.
    """
    user = await require_authenticated_user(x_user_email)

    # Get the package
    package = await db.asceticismpackage.find_unique(
        where={"id": package_id}, include={"items": True}
    )

    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    if not package.isPublished:
        raise HTTPException(status_code=403, detail="Package is not published")

    # Add each asceticism to the user's account
    added_count = 0
    skipped_count = 0

    for item in package.items:
        # Check if user already has this asceticism
        existing = await db.userasceticism.find_first(
            where={"userId": user.id, "asceticismId": item.asceticismId}
        )

        if not existing:
            # Add the asceticism to user's account
            await db.userasceticism.create(
                data={
                    "userId": user.id,
                    "asceticismId": item.asceticismId,
                    "status": AsceticismStatus.ACTIVE,
                }
            )
            added_count += 1
        else:
            skipped_count += 1

    return {
        "success": True,
        "message": f"Added {added_count} asceticism(s) to your account",
        "addedCount": added_count,
        "skippedCount": skipped_count,
        "totalInPackage": len(package.items),
    }


# --- Helper Functions ---


def format_package_response(package: AsceticismPackage) -> PackageResponse:
    """Format package with items for response"""
    items = []
    if hasattr(package, "items") and package.items:
        for item in package.items:
            items.append(
                PackageItemResponse(
                    id=item.id,
                    asceticismId=item.asceticismId,
                    order=item.order,
                    notes=item.notes,
                    asceticism=AsceticismInfo(
                        id=item.asceticism.id,
                        title=item.asceticism.title,
                        description=item.asceticism.description,
                        category=item.asceticism.category,
                        icon=item.asceticism.icon,
                        type=str(item.asceticism.type),
                    ),
                )
            )

    return PackageResponse(
        id=package.id,
        title=package.title,
        description=package.description,
        creatorId=package.creatorId,
        isPublished=package.isPublished,
        metadata=package.metadata,
        createdAt=package.createdAt.isoformat(),
        updatedAt=package.updatedAt.isoformat(),
        items=items,
        itemCount=len(items),
    )
