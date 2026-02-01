"""Packages router for managing asceticism packages."""

from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Header, Depends
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.auth import require_admin, get_current_user
from app.models import (
    AsceticismPackage,
    PackageItem,
    User,
    Asceticism,
    UserAsceticism,
    UserRole,
    AsceticismStatus,
)
from app.schemas.packages import (
    PackageItemInput,
    PackageCreate,
    PackageUpdate,
    AsceticismInfo,
    PackageItemResponse,
    PackageResponse,
    AddPackageToAccountRequest,
)

router = APIRouter(prefix="/packages", tags=["packages"])


def format_package_response(
    package: AsceticismPackage, items: list[tuple[PackageItem, Asceticism]]
) -> PackageResponse:
    """Format package with items for response."""
    formatted_items = []
    for item, asceticism in items:
        formatted_items.append(
            PackageItemResponse(
                id=item.id,
                asceticismId=item.asceticismId,
                order=item.order,
                notes=item.notes,
                asceticism=AsceticismInfo(
                    id=asceticism.id,
                    title=asceticism.title,
                    description=asceticism.description,
                    category=asceticism.category,
                    icon=asceticism.icon,
                    type=asceticism.type.value,
                ),
            )
        )

    return PackageResponse(
        id=package.id,
        title=package.title,
        description=package.description,
        creatorId=package.creatorId,
        isPublished=package.isPublished,
        custom_metadata=package.custom_metadata,
        createdAt=package.createdAt,
        updatedAt=package.updatedAt,
        items=formatted_items,
        itemCount=len(formatted_items),
    )


@router.post("/", response_model=PackageResponse)
async def create_package(
    package_data: PackageCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """Create a new asceticism package (admin only)."""

    # Create the package
    package = AsceticismPackage(
        title=package_data.title,
        description=package_data.description,
        creatorId=current_user.id,
        isPublished=False,
        custom_metadata=package_data.custom_metadata,
    )

    session.add(package)
    session.commit()
    session.refresh(package)

    # Create package items
    items = []
    for item_data in package_data.items:
        # Verify asceticism exists
        asceticism = session.get(Asceticism, item_data.asceticismId)
        if not asceticism:
            # Cleanup: delete the package if an asceticism doesn't exist
            session.delete(package)
            session.commit()
            raise HTTPException(
                status_code=404, detail=f"Asceticism {item_data.asceticismId} not found"
            )

        item = PackageItem(
            packageId=package.id,
            asceticismId=item_data.asceticismId,
            order=item_data.order,
            notes=item_data.notes,
        )
        session.add(item)
        items.append((item, asceticism))

    session.commit()

    return format_package_response(package, items)


@router.get("/admin/all", response_model=list[PackageResponse])
async def get_all_packages_admin(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """Get all packages including unpublished ones (admin only)."""

    statement = select(AsceticismPackage).order_by(AsceticismPackage.createdAt.desc())
    packages = session.exec(statement).all()

    result = []
    for package in packages:
        # Get package items with asceticisms
        items_stmt = (
            select(PackageItem, Asceticism)
            .join(Asceticism, PackageItem.asceticismId == Asceticism.id)
            .where(PackageItem.packageId == package.id)
            .order_by(PackageItem.order.asc())
        )
        items = session.exec(items_stmt).all()

        result.append(format_package_response(package, items))

    return result


@router.put("/{package_id}", response_model=PackageResponse)
async def update_package(
    package_id: int,
    package_data: PackageUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """Update a package (admin only)."""

    # Check if package exists
    package = session.get(AsceticismPackage, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    # Update package fields
    if package_data.title is not None:
        package.title = package_data.title
    if package_data.description is not None:
        package.description = package_data.description
    if package_data.custom_metadata is not None:
        package.custom_metadata = package_data.custom_metadata

    package.updatedAt = datetime.utcnow()

    # Update items if provided
    if package_data.items is not None:
        # Delete existing items
        delete_stmt = select(PackageItem).where(PackageItem.packageId == package_id)
        existing_items = session.exec(delete_stmt).all()
        for item in existing_items:
            session.delete(item)

        # Create new items
        for item_data in package_data.items:
            # Verify asceticism exists
            asceticism = session.get(Asceticism, item_data.asceticismId)
            if not asceticism:
                raise HTTPException(
                    status_code=404,
                    detail=f"Asceticism {item_data.asceticismId} not found",
                )

            item = PackageItem(
                packageId=package_id,
                asceticismId=item_data.asceticismId,
                order=item_data.order,
                notes=item_data.notes,
            )
            session.add(item)

    session.add(package)
    session.commit()
    session.refresh(package)

    # Get updated items
    items_stmt = (
        select(PackageItem, Asceticism)
        .join(Asceticism, PackageItem.asceticismId == Asceticism.id)
        .where(PackageItem.packageId == package_id)
        .order_by(PackageItem.order.asc())
    )
    items = session.exec(items_stmt).all()

    return format_package_response(package, items)


@router.post("/{package_id}/publish")
async def publish_package(
    package_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """Publish or unpublish a package (admin only)."""

    package = session.get(AsceticismPackage, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    # Toggle published status
    package.isPublished = not package.isPublished
    package.updatedAt = datetime.utcnow()

    session.add(package)
    session.commit()

    return {"success": True, "isPublished": package.isPublished}


@router.delete("/{package_id}")
async def delete_package(
    package_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """Delete a package (admin only)."""

    package = session.get(AsceticismPackage, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    # Delete package items first
    items_stmt = select(PackageItem).where(PackageItem.packageId == package_id)
    items = session.exec(items_stmt).all()
    for item in items:
        session.delete(item)

    # Delete package
    session.delete(package)
    session.commit()

    return {"success": True, "message": "Package deleted"}


@router.get("/browse", response_model=list[PackageResponse])
async def browse_published_packages(session: Session = Depends(get_session)):
    """Get all published packages (available to all users)."""
    statement = (
        select(AsceticismPackage)
        .where(AsceticismPackage.isPublished == True)
        .order_by(AsceticismPackage.createdAt.desc())
    )
    packages = session.exec(statement).all()

    result = []
    for package in packages:
        # Get package items with asceticisms
        items_stmt = (
            select(PackageItem, Asceticism)
            .join(Asceticism, PackageItem.asceticismId == Asceticism.id)
            .where(PackageItem.packageId == package.id)
            .order_by(PackageItem.order.asc())
        )
        items = session.exec(items_stmt).all()

        result.append(format_package_response(package, items))

    return result


@router.get("/{package_id}", response_model=PackageResponse)
async def get_package_details(package_id: int, session: Session = Depends(get_session)):
    """Get details of a specific published package."""
    package = session.get(AsceticismPackage, package_id)

    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    if not package.isPublished:
        raise HTTPException(status_code=403, detail="Package is not published")

    # Get package items with asceticisms
    items_stmt = (
        select(PackageItem, Asceticism)
        .join(Asceticism, PackageItem.asceticismId == Asceticism.id)
        .where(PackageItem.packageId == package_id)
        .order_by(PackageItem.order.asc())
    )
    items = session.exec(items_stmt).all()

    return format_package_response(package, items)


@router.post("/{package_id}/add-to-account")
async def add_package_to_account(
    package_id: int,
    request: AddPackageToAccountRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Add all asceticisms from a package to the user's account."""

    # Get the package
    package = session.get(AsceticismPackage, package_id)

    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    if not package.isPublished:
        raise HTTPException(status_code=403, detail="Package is not published")

    # Get package items
    items_stmt = select(PackageItem).where(PackageItem.packageId == package_id)
    items = session.exec(items_stmt).all()

    # Add each asceticism to the user's account or reactivate if archived
    added_count = 0
    reactivated_count = 0

    # Use provided dates or defaults
    start_date = request.startDate if request.startDate else datetime.now(timezone.utc)
    end_date = request.endDate

    for item in items:
        # Check if user already has this asceticism
        existing_stmt = select(UserAsceticism).where(
            UserAsceticism.userId == current_user.id,
            UserAsceticism.asceticismId == item.asceticismId,
        )
        existing = session.exec(existing_stmt).first()

        if existing:
            # If it exists, mark it as ACTIVE with the new dates
            existing.status = AsceticismStatus.ACTIVE
            existing.startDate = start_date
            existing.endDate = end_date
            existing.updatedAt = datetime.now(timezone.utc)
            reactivated_count += 1
        else:
            # Add the asceticism to user's account
            user_asceticism = UserAsceticism(
                userId=current_user.id,
                asceticismId=item.asceticismId,
                status=AsceticismStatus.ACTIVE,
                startDate=start_date,
                endDate=end_date,
            )
            session.add(user_asceticism)
            added_count += 1

    session.commit()

    total_activated = added_count + reactivated_count
    message = f"Activated {total_activated} asceticism(s)"
    if added_count > 0 and reactivated_count > 0:
        message += f" ({added_count} new, {reactivated_count} reactivated)"
    elif reactivated_count > 0:
        message += " (all reactivated)"

    return {
        "success": True,
        "message": message,
        "addedCount": added_count,
        "skippedCount": 0,  # No longer skipping any
        "totalInPackage": len(items),
    }
