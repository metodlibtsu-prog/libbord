import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewOut, ReviewUpdate

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.get("", response_model=list[ReviewOut])
async def list_reviews(
    library_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review)
        .where(Review.library_id == library_id)
        .order_by(Review.date.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.post("", response_model=ReviewOut, status_code=201)
async def create_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    review = Review(**data.model_dump())
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


@router.put("/{review_id}", response_model=ReviewOut)
async def update_review(
    review_id: uuid.UUID,
    data: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(review, key, val)
    await db.commit()
    await db.refresh(review)
    return review


@router.delete("/{review_id}", status_code=204)
async def delete_review(
    review_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    await db.delete(review)
    await db.commit()
