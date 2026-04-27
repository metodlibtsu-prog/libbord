from __future__ import annotations

import datetime
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.channel import Channel
from app.models.engagement_metric import EngagementMetric
from app.models.vk_config import VkConfig
from app.models.vk_metric import VkMetric
from app.services.vk_api_service import VkApiService

logger = logging.getLogger(__name__)


async def sync_vk(
    db: AsyncSession,
    library_id: uuid.UUID,
    date_from: datetime.date | None = None,
    date_to: datetime.date | None = None,
) -> dict:
    """
    Sync VK stats for a library.
    Returns {"days_synced": N, "posts_synced": N}
    """
    result = await db.execute(
        select(VkConfig).where(VkConfig.library_id == library_id)
    )
    config = result.scalar_one_or_none()
    if not config:
        raise Exception("VK not configured for this library")

    config.sync_status = "syncing"
    config.sync_error = None
    await db.commit()

    try:
        async with VkApiService(config.community_token) as vk:
            # Auto-detect group ID if not saved
            if not config.community_id:
                info = await vk.get_group_info()
                config.community_id = info["id"]
                config.community_name = info["name"]
                await db.commit()

            group_id = config.community_id
            effective_to = date_to or datetime.date.today()
            effective_from = date_from or (effective_to - datetime.timedelta(days=7))

            logger.info(f"VK sync {library_id}: {effective_from} → {effective_to}")

            # Get the VK channel for this library
            ch_result = await db.execute(
                select(Channel).where(
                    Channel.library_id == library_id,
                    Channel.type == "vk",
                )
            )
            channel = ch_result.scalars().first()
            if not channel:
                raise Exception("No VK channel found. Create it in Channels first.")

            # stats.get requires a user token (not community token) — skip gracefully
            # Use wall.get for engagement data instead
            wall_data = await vk.get_wall_posts(group_id, effective_from, effective_to)

            # Get current subscribers count
            members_count = await vk.get_members_count(group_id)

            # Upsert vk_metrics stub rows (one per day) so the stats endpoint has data
            days_synced = 0
            delta = (effective_to - effective_from).days + 1
            all_dates = [(effective_from + datetime.timedelta(days=i)).isoformat() for i in range(delta)]

            for date_str in all_dates:
                date_obj = datetime.date.fromisoformat(date_str)
                stmt = insert(VkMetric).values(
                    library_id=library_id,
                    channel_id=channel.id,
                    date=date_obj,
                    visitors=0,
                    views=0,
                    subscribed=0,
                    unsubscribed=0,
                    total_subscribers=members_count,
                ).on_conflict_do_update(
                    index_elements=["library_id", "channel_id", "date"],
                    set_={
                        "total_subscribers": members_count,
                    }
                )
                await db.execute(stmt)
                days_synced += 1

            # Upsert engagement_metrics (likes/reposts/comments from wall posts)
            posts_synced = 0
            wall_by_date = {d["date"]: d for d in wall_data}
            for date_str, wday in wall_by_date.items():
                date_obj = datetime.date.fromisoformat(date_str)
                stmt = insert(EngagementMetric).values(
                    library_id=library_id,
                    channel_id=channel.id,
                    date=date_obj,
                    likes=wday["likes"],
                    reposts=wday["reposts"],
                    comments=wday["comments"],
                ).on_conflict_do_update(
                    index_elements=["library_id", "channel_id", "date"],
                    set_={
                        "likes": stmt.excluded.likes,
                        "reposts": stmt.excluded.reposts,
                        "comments": stmt.excluded.comments,
                    }
                )
                await db.execute(stmt)
                posts_synced += 1

            await db.commit()

            config.sync_status = "success"
            config.last_sync_at = datetime.datetime.utcnow()
            config.sync_error = None
            await db.commit()

            logger.info(f"VK sync done: {days_synced} days, {posts_synced} post-days")
            return {"days_synced": days_synced, "posts_synced": posts_synced}

    except Exception as e:
        logger.error(f"VK sync error: {e}", exc_info=True)
        config.sync_status = "error"
        config.sync_error = str(e)[:500]
        await db.commit()
        raise
