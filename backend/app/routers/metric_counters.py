import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.metric_counter import MetricCounter
from app.schemas.metric_counter import MetricCounterCreate, MetricCounterOut, MetricCounterUpdate

router = APIRouter(prefix="/api/metric-counters", tags=["metric-counters"])


@router.post("", response_model=MetricCounterOut, status_code=201)
async def create_counter(
    data: MetricCounterCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    counter = MetricCounter(**data.model_dump())
    db.add(counter)
    await db.commit()
    await db.refresh(counter)
    return counter


@router.put("/{counter_id}", response_model=MetricCounterOut)
async def update_counter(
    counter_id: uuid.UUID,
    data: MetricCounterUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    counter = await db.get(MetricCounter, counter_id)
    if not counter:
        raise HTTPException(status_code=404, detail="Counter not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(counter, key, val)
    await db.commit()
    await db.refresh(counter)
    return counter


@router.delete("/{counter_id}", status_code=204)
async def delete_counter(
    counter_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    counter = await db.get(MetricCounter, counter_id)
    if not counter:
        raise HTTPException(status_code=404, detail="Counter not found")
    await db.delete(counter)
    await db.commit()
