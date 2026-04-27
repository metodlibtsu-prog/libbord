from __future__ import annotations

import asyncio
import datetime
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

API_VERSION = "5.199"
BASE_URL = "https://api.vk.com/method"


class VkApiService:
    def __init__(self, token: str, service_token: str | None = None):
        self.token = token
        self.service_token = service_token
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        await self.client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        await self.close()

    async def _call(self, method: str, **params) -> Any:
        params.update(access_token=self.token, v=API_VERSION)
        resp = await self.client.get(f"{BASE_URL}/{method}", params=params)
        resp.raise_for_status()
        data = resp.json()
        if "error" in data:
            raise Exception(f"VK API error {data['error']['error_code']}: {data['error']['error_msg']}")
        return data["response"]

    async def _public_call(self, method: str, **params) -> Any:
        """Call VK API without auth token — for public read methods (wall.get on public groups)."""
        params.update(v=API_VERSION)
        resp = await self.client.get(f"{BASE_URL}/{method}", params=params)
        resp.raise_for_status()
        data = resp.json()
        if "error" in data:
            raise Exception(f"VK API error {data['error']['error_code']}: {data['error']['error_msg']}")
        return data["response"]

    async def get_group_info(self) -> dict:
        """Auto-detect group ID and name from community token."""
        result = await self._call("groups.getById", fields="members_count")
        if result and isinstance(result, dict):
            groups = result.get("groups", [])
        else:
            groups = result if isinstance(result, list) else []
        if not groups:
            raise Exception("No group found for this token")
        g = groups[0]
        return {"id": str(g["id"]), "name": g.get("name", "")}

    async def get_daily_stats(
        self,
        group_id: str,
        date_from: datetime.date,
        date_to: datetime.date,
    ) -> list[dict]:
        """
        Fetch daily stats via stats.get.
        Returns list of dicts with keys: date, visitors, views,
        subscribed, unsubscribed, likes, reach.
        """
        result = await self._call(
            "stats.get",
            group_id=group_id,
            date_from=date_from.strftime("%Y-%m-%d"),
            date_to=date_to.strftime("%Y-%m-%d"),
            interval="day",
            intervals_count=400,
            extended=1,
        )
        days = []
        items = result if isinstance(result, list) else result.get("items", [])
        for item in items:
            date_str = item.get("period_from", "")
            if not date_str:
                continue
            visitors = item.get("visitors", {})
            reach = item.get("reach", {})
            activity = item.get("activity", {})
            days.append({
                "date": date_str,
                "visitors": visitors.get("count", 0) if isinstance(visitors, dict) else 0,
                "views": visitors.get("views", 0) if isinstance(visitors, dict) else 0,
                "subscribed": activity.get("subscribed", 0) if isinstance(activity, dict) else 0,
                "unsubscribed": activity.get("unsubscribed", 0) if isinstance(activity, dict) else 0,
                "likes": activity.get("likes", 0) if isinstance(activity, dict) else 0,
                "reach": reach.get("count", 0) if isinstance(reach, dict) else 0,
            })
        return days

    async def get_wall_posts(
        self,
        group_id: str,
        date_from: datetime.date,
        date_to: datetime.date,
    ) -> list[dict]:
        """
        Fetch wall posts in date range.
        Paginates automatically. Returns per-day aggregates:
        {date, posts, likes, reposts, comments}
        """
        owner_id = f"-{group_id}"
        date_from_ts = int(datetime.datetime.combine(date_from, datetime.time.min).timestamp())
        date_to_ts = int(datetime.datetime.combine(date_to, datetime.time.max).timestamp())

        all_posts = []
        offset = 0
        count = 100

        while True:
            await asyncio.sleep(0.4)  # VK rate limit: ~3 req/s
            try:
                # Service token can call wall.get; community token cannot (Error 27)
                token = self.service_token or self.token
                params_wall: dict = dict(access_token=token, v=API_VERSION,
                                         owner_id=owner_id, count=count, offset=offset)
                resp = await self.client.get(f"{BASE_URL}/wall.get", params=params_wall)
                resp.raise_for_status()
                data = resp.json()
                if "error" in data:
                    code = data["error"]["error_code"]
                    if code in (15, 27):
                        logger.warning(f"wall.get unavailable ({code}): no service token or access denied")
                        return []
                    raise Exception(f"VK API error {code}: {data['error']['error_msg']}")
                result = data["response"]
            except Exception as exc:
                if "error_code" not in str(exc):
                    raise
                return []
            items = result.get("items", [])
            if not items:
                break

            for post in items:
                post_ts = post.get("date", 0)
                if post_ts < date_from_ts:
                    # Posts are sorted newest first — stop when we pass date_from
                    return _aggregate_posts(all_posts)
                if post_ts <= date_to_ts:
                    all_posts.append({
                        "date": datetime.datetime.fromtimestamp(post_ts).date().isoformat(),
                        "likes": post.get("likes", {}).get("count", 0),
                        "reposts": post.get("reposts", {}).get("count", 0),
                        "comments": post.get("comments", {}).get("count", 0),
                    })

            if len(items) < count:
                break
            offset += count

        return _aggregate_posts(all_posts)

    async def get_members_count(self, group_id: str) -> int:
        """Get current total subscribers count."""
        result = await self._call("groups.getById", group_id=group_id, fields="members_count")
        groups = result.get("groups", []) if isinstance(result, dict) else result
        if groups:
            return groups[0].get("members_count", 0)
        return 0


def _aggregate_posts(posts: list[dict]) -> list[dict]:
    """Aggregate post-level data into per-day totals."""
    by_date: dict[str, dict] = {}
    for p in posts:
        d = p["date"]
        if d not in by_date:
            by_date[d] = {"date": d, "posts": 0, "likes": 0, "reposts": 0, "comments": 0}
        by_date[d]["posts"] += 1
        by_date[d]["likes"] += p["likes"]
        by_date[d]["reposts"] += p["reposts"]
        by_date[d]["comments"] += p["comments"]
    return list(by_date.values())
