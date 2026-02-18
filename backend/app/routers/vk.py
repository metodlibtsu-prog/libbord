"""
VK integration router

Endpoints for uploading VK CSV exports and retrieving statistics.
"""

import logging
import os
import tempfile
import uuid
from datetime import date, datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.channel import Channel
from app.models.engagement_metric import EngagementMetric
from app.models.vk_metric import VkMetric
from app.models.vk_upload import VkUpload
from app.schemas.vk import (
    VkContentPoint,
    VkEngagementPoint,
    VkKpi,
    VkPeriodInfo,
    VkReachPoint,
    VkStatsResponse,
    VkTopPost,
    VkUploadOut,
    VkUploadSummary,
)
from app.services.insights_engine import generate_vk_insights
from app.services.vk_csv_service import extract_period_from_csv, parse_vk_csv, validate_csv_format

router = APIRouter(prefix="/api/vk", tags=["vk"])
logger = logging.getLogger(__name__)


@router.post("/upload", response_model=VkUploadSummary, status_code=201)
async def upload_vk_csv(
    library_id: uuid.UUID = Query(...),
    channel_id: uuid.UUID = Query(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """
    Upload VK CSV export

    1. Save CSV to temp file
    2. Validate format
    3. Parse CSV
    4. Create VkUpload record
    5. Upsert metrics to vk_metrics + engagement_metrics
    6. Update VkUpload status
    7. Clean up temp file
    """
    temp_path = None

    try:
        # 1. Save uploaded file to temp directory
        with tempfile.NamedTemporaryFile(mode="wb", delete=False, suffix=".csv") as tmp:
            content = await file.read()
            tmp.write(content)
            temp_path = tmp.name

        logger.info(f"Saved CSV to temp file: {temp_path}")

        # 2. Validate CSV format
        try:
            validate_csv_format(temp_path)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {e}")

        # 3. Extract period and parse CSV
        period_start, period_end = extract_period_from_csv(temp_path)
        daily_metrics = parse_vk_csv(temp_path)

        if not daily_metrics:
            raise HTTPException(status_code=400, detail="No metrics found in CSV")

        logger.info(f"Parsed {len(daily_metrics)} days of metrics from CSV")

        # 4. Create VkUpload record (status=processing)
        upload = VkUpload(
            library_id=library_id,
            channel_id=channel_id,
            filename=file.filename or "upload.csv",
            uploaded_at=datetime.utcnow(),
            period_start=period_start,
            period_end=period_end,
            total_rows=len(daily_metrics),
            status="processing",
        )
        db.add(upload)
        await db.commit()
        await db.refresh(upload)

        logger.info(f"Created VkUpload record: {upload.id}")

        # 5. Upsert metrics
        vk_metrics_count = 0
        engagement_metrics_count = 0

        for date_obj, metrics in daily_metrics.items():
            # 5a. Upsert VK metrics
            stmt = insert(VkMetric).values(
                library_id=library_id,
                channel_id=channel_id,
                upload_id=upload.id,
                date=date_obj,
                visitors=metrics.visitors,
                views=metrics.views,
                posts=metrics.posts,
                stories=metrics.stories,
                clips=metrics.clips,
                videos=metrics.videos,
                subscribed=metrics.subscribed,
                unsubscribed=metrics.unsubscribed,
                total_subscribers=metrics.total_subscribers,
                site_clicks=metrics.site_clicks,
            )

            stmt = stmt.on_conflict_do_update(
                index_elements=["library_id", "channel_id", "date"],
                set_={
                    "upload_id": stmt.excluded.upload_id,
                    "visitors": stmt.excluded.visitors,
                    "views": stmt.excluded.views,
                    "posts": stmt.excluded.posts,
                    "stories": stmt.excluded.stories,
                    "clips": stmt.excluded.clips,
                    "videos": stmt.excluded.videos,
                    "subscribed": stmt.excluded.subscribed,
                    "unsubscribed": stmt.excluded.unsubscribed,
                    "total_subscribers": stmt.excluded.total_subscribers,
                    "site_clicks": stmt.excluded.site_clicks,
                },
            )

            await db.execute(stmt)
            vk_metrics_count += 1

            # 5b. Upsert engagement metrics (if present)
            if metrics.likes > 0 or metrics.reposts > 0 or metrics.comments > 0:
                eng_stmt = insert(EngagementMetric).values(
                    library_id=library_id,
                    channel_id=channel_id,
                    date=date_obj,
                    likes=metrics.likes,
                    reposts=metrics.reposts,
                    comments=metrics.comments,
                )

                eng_stmt = eng_stmt.on_conflict_do_update(
                    index_elements=["library_id", "channel_id", "date"],
                    set_={
                        "likes": eng_stmt.excluded.likes,
                        "reposts": eng_stmt.excluded.reposts,
                        "comments": eng_stmt.excluded.comments,
                    },
                )

                await db.execute(eng_stmt)
                engagement_metrics_count += 1

        await db.commit()

        logger.info(
            f"Upserted {vk_metrics_count} VK metrics and {engagement_metrics_count} engagement metrics"
        )

        # 6. Update VkUpload status to completed
        upload.status = "completed"
        await db.commit()

        logger.info(f"Upload {upload.id} completed successfully")

        return VkUploadSummary(
            upload_id=upload.id,
            total_rows=len(daily_metrics),
            period_start=period_start,
            period_end=period_end,
            vk_metrics_count=vk_metrics_count,
            engagement_metrics_count=engagement_metrics_count,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading VK CSV: {e}", exc_info=True)

        # Update upload status to error
        if "upload" in locals():
            upload.status = "error"
            upload.error_message = str(e)[:500]
            await db.commit()

        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    finally:
        # 7. Clean up temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
                logger.info(f"Cleaned up temp file: {temp_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up temp file: {e}")


@router.get("/stats", response_model=VkStatsResponse)
async def get_vk_stats(
    library_id: uuid.UUID = Query(...),
    channel_id: uuid.UUID | None = Query(None),
    period: str = Query("month", regex="^(today|yesterday|week|month|quarter|year)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get VK statistics for dashboard

    Returns:
    - KPIs with deltas to previous period
    - Reach and engagement trends
    - Top posts by ER
    - Period info
    - Insights
    """
    # Determine date range based on period
    today = date.today()
    if period == "today":
        date_from = today
        date_to = today
    elif period == "yesterday":
        date_from = today - timedelta(days=1)
        date_to = today - timedelta(days=1)
    elif period == "week":
        date_from = today - timedelta(days=7)
        date_to = today
    elif period == "month":
        date_from = today - timedelta(days=30)
        date_to = today
    elif period == "quarter":
        date_from = today - timedelta(days=90)
        date_to = today
    else:  # year
        date_from = today - timedelta(days=365)
        date_to = today

    # Get latest upload info (for metadata only)
    upload_query = select(VkUpload).where(VkUpload.library_id == library_id)
    if channel_id:
        upload_query = upload_query.where(VkUpload.channel_id == channel_id)
    upload_query = upload_query.where(VkUpload.status == "completed")
    upload_query = upload_query.order_by(VkUpload.uploaded_at.desc()).limit(1)

    upload_result = await db.execute(upload_query)
    latest_upload = upload_result.scalar_one_or_none()

    # Build base queries
    vk_query = select(VkMetric).where(
        VkMetric.library_id == library_id,
        VkMetric.date >= date_from,
        VkMetric.date <= date_to,
    )
    eng_query = select(EngagementMetric).where(
        EngagementMetric.library_id == library_id,
        EngagementMetric.date >= date_from,
        EngagementMetric.date <= date_to,
    )

    if channel_id:
        vk_query = vk_query.where(VkMetric.channel_id == channel_id)
        eng_query = eng_query.where(EngagementMetric.channel_id == channel_id)

    # Fetch metrics
    vk_result = await db.execute(vk_query.order_by(VkMetric.date.asc()))
    vk_metrics = vk_result.scalars().all()

    eng_result = await db.execute(eng_query.order_by(EngagementMetric.date.asc()))
    eng_metrics = eng_result.scalars().all()

    if not vk_metrics and not eng_metrics:
        raise HTTPException(status_code=404, detail="No VK data found for this period")

    # Calculate KPIs
    total_reach = sum(m.visitors for m in vk_metrics)
    total_views = sum(m.views for m in vk_metrics)
    latest_subscribers = vk_metrics[-1].total_subscribers if vk_metrics else 0
    total_likes = sum(m.likes for m in eng_metrics)
    total_reposts = sum(m.reposts for m in eng_metrics)
    total_comments = sum(m.comments for m in eng_metrics)

    # Calculate ER (engagement rate)
    total_engagement = total_likes + total_reposts + total_comments
    er_pct = (total_engagement / total_reach * 100) if total_reach > 0 else 0

    # TODO: Calculate deltas to previous period (simplified for now)
    kpis = VkKpi(
        reach=total_reach,
        views=total_views,
        subscribers=latest_subscribers,
        er_pct=round(er_pct, 2),
        reposts=total_reposts,
        comments=total_comments,
        reach_delta_pct=None,
        views_delta_pct=None,
        subscribers_delta_pct=None,
        er_delta_pct=None,
    )

    # Build reach trend
    reach_trend = [
        VkReachPoint(date=str(m.date), reach=m.visitors, views=m.views) for m in vk_metrics
    ]

    # Build engagement trend
    engagement_trend = []
    for m in eng_metrics:
        total_eng = m.likes + m.reposts + m.comments
        # Find corresponding VK metric for reach
        vk_m = next((v for v in vk_metrics if v.date == m.date), None)
        reach = vk_m.visitors if vk_m else 0
        er = (total_eng / reach * 100) if reach > 0 else 0

        engagement_trend.append(
            VkEngagementPoint(
                date=str(m.date),
                likes=m.likes,
                reposts=m.reposts,
                comments=m.comments,
                er=round(er, 2),
            )
        )

    # Build top posts (simplified - group by date)
    top_posts = []
    for m in eng_metrics[:10]:  # Top 10
        vk_m = next((v for v in vk_metrics if v.date == m.date), None)
        reach = vk_m.visitors if vk_m else 0
        total_eng = m.likes + m.reposts + m.comments
        er = (total_eng / reach * 100) if reach > 0 else 0

        # Determine content type based on VK metrics
        content_type = "Пост"
        if vk_m:
            if vk_m.stories > 0:
                content_type = "История"
            elif vk_m.clips > 0:
                content_type = "Клип"
            elif vk_m.videos > 0:
                content_type = "Видео"

        top_posts.append(
            VkTopPost(
                date=str(m.date),
                type=content_type,
                reach=reach,
                er=round(er, 2),
                likes=m.likes,
                comments=m.comments,
            )
        )

    # Sort by ER
    top_posts.sort(key=lambda x: x.er, reverse=True)
    top_posts = top_posts[:10]

    # Build content trend (posts, stories, clips, videos)
    content_trend = [
        VkContentPoint(
            date=str(m.date),
            posts=m.posts,
            stories=m.stories,
            clips=m.clips,
            videos=m.videos,
        )
        for m in vk_metrics
    ]

    # Period info
    period_info = VkPeriodInfo(
        start=str(date_from),
        end=str(date_to),
        upload_date=str(latest_upload.uploaded_at.date()) if latest_upload else None,
    )

    # Generate VK insights
    insights = generate_vk_insights(kpis)

    return VkStatsResponse(
        kpis=kpis,
        reach_trend=reach_trend,
        engagement_trend=engagement_trend,
        content_trend=content_trend,
        top_posts=top_posts,
        period_info=period_info,
        insights=insights,
    )


@router.get("/uploads", response_model=List[VkUploadOut])
async def list_vk_uploads(
    library_id: uuid.UUID = Query(...),
    channel_id: uuid.UUID | None = Query(None),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List VK uploads history"""
    query = select(VkUpload).where(VkUpload.library_id == library_id)

    if channel_id:
        query = query.where(VkUpload.channel_id == channel_id)

    query = query.order_by(VkUpload.uploaded_at.desc()).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.delete("/uploads/{upload_id}", status_code=204)
async def delete_vk_upload(
    upload_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Delete VK upload and associated metrics"""
    upload = await db.get(VkUpload, upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    # Delete upload (cascade will delete associated vk_metrics)
    await db.delete(upload)
    await db.commit()

    logger.info(f"Deleted VK upload {upload_id}")
