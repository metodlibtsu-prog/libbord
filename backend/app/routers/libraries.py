import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.library import Library
from app.models.metric_counter import MetricCounter
from app.schemas.library import LibraryCreate, LibraryOut, LibraryUpdate
from app.schemas.metric_counter import MetricCounterOut

router = APIRouter(prefix="/api/libraries", tags=["libraries"])


@router.get("", response_model=list[LibraryOut])
async def list_libraries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Library).order_by(Library.created_at))
    return result.scalars().all()


@router.get("/{library_id}", response_model=LibraryOut)
async def get_library(library_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    lib = await db.get(Library, library_id)
    if not lib:
        raise HTTPException(status_code=404, detail="Library not found")
    return lib


@router.post("", response_model=LibraryOut, status_code=201)
async def create_library(
    data: LibraryCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    lib = Library(**data.model_dump())
    db.add(lib)
    await db.commit()
    await db.refresh(lib)
    return lib


@router.put("/{library_id}", response_model=LibraryOut)
async def update_library(
    library_id: uuid.UUID,
    data: LibraryUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    lib = await db.get(Library, library_id)
    if not lib:
        raise HTTPException(status_code=404, detail="Library not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(lib, key, val)
    await db.commit()
    await db.refresh(lib)
    return lib


@router.delete("/{library_id}", status_code=204)
async def delete_library(
    library_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    lib = await db.get(Library, library_id)
    if not lib:
        raise HTTPException(status_code=404, detail="Library not found")
    await db.delete(lib)
    await db.commit()


@router.get("/{library_id}/counters", response_model=list[MetricCounterOut])
async def list_counters(library_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MetricCounter)
        .where(MetricCounter.library_id == library_id)
        .order_by(MetricCounter.created_at)
    )
    return result.scalars().all()
