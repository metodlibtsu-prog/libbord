from __future__ import annotations

import datetime
import httpx
from typing import Any

from app.config import settings


class YandexMetrikaService:
    """Service for interacting with Yandex.Metrika API"""

    OAUTH_BASE_URL = "https://oauth.yandex.com"
    API_BASE_URL = "https://api-metrika.yandex.net"

    def __init__(self, access_token: str):
        """Initialize service with access token"""
        self.access_token = access_token
        self.client = httpx.AsyncClient(
            headers={"Authorization": f"OAuth {access_token}"},
            timeout=30.0,
        )

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    @staticmethod
    async def exchange_code_for_token(code: str) -> dict[str, Any]:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{YandexMetrikaService.OAUTH_BASE_URL}/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": settings.yandex_client_id,
                    "client_secret": settings.yandex_client_secret,
                    "redirect_uri": settings.yandex_redirect_uri,  # Required!
                },
            )
            response.raise_for_status()
            data = response.json()

            # Calculate expires_at (timezone-naive UTC)
            expires_in = data.get("expires_in", 31536000)  # Default 1 year
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(
                seconds=expires_in
            )

            return {
                "access_token": data["access_token"],
                "refresh_token": data.get("refresh_token"),
                "expires_at": expires_at,
            }

    @staticmethod
    async def refresh_access_token(refresh_token: str) -> dict[str, Any]:
        """Refresh access token using refresh token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{YandexMetrikaService.OAUTH_BASE_URL}/token",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": settings.yandex_client_id,
                    "client_secret": settings.yandex_client_secret,
                },
            )
            response.raise_for_status()
            data = response.json()

            expires_in = data.get("expires_in", 31536000)
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(
                seconds=expires_in
            )

            return {
                "access_token": data["access_token"],
                "refresh_token": data.get("refresh_token"),
                "expires_at": expires_at,
            }

    async def list_counters(self) -> list[dict[str, Any]]:
        """Get list of available counters"""
        response = await self.client.get(f"{self.API_BASE_URL}/management/v1/counters")
        response.raise_for_status()
        data = response.json()

        counters = data.get("counters", [])
        return [
            {
                "id": counter["id"],
                "name": counter.get("name", f"Counter {counter['id']}"),
                "status": counter.get("code_status"),
            }
            for counter in counters
        ]

    async def fetch_metrics(
        self,
        counter_id: str,
        date_from: datetime.date,
        date_to: datetime.date,
    ) -> dict[str, Any]:
        """
        Fetch metrics data from Yandex.Metrika for given date range

        Returns dict with dates as keys and metrics as values:
        {
            "2026-02-10": {
                "views": 1234,
                "visits": 456,
                "users": 123,
                "avg_time": 120.5,
                "depth": 2.3,
                "bounce_rate": 0.45,
                "return_rate": 0.12
            },
            ...
        }
        """
        metrics = [
            "ym:s:pageviews",  # просмотры (views)
            "ym:s:visits",  # визиты
            "ym:s:users",  # пользователи
            "ym:s:avgVisitDurationSeconds",  # среднее время (avg_time)
            "ym:s:pageDepth",  # глубина
            "ym:s:bounceRate",  # показатель отказов
            "ym:s:percentNewVisits",  # процент новых визитов (для расчета return_rate)
        ]

        params = {
            "ids": counter_id,
            "date1": date_from.strftime("%Y-%m-%d"),
            "date2": date_to.strftime("%Y-%m-%d"),
            "metrics": ",".join(metrics),
            "dimensions": "ym:s:date",
            "group": "day",
            "accuracy": "high",
        }

        response = await self.client.get(
            f"{self.API_BASE_URL}/stat/v1/data", params=params
        )
        response.raise_for_status()
        data = response.json()

        # Parse response
        result = {}
        rows = data.get("data", [])

        for row in rows:
            dimensions = row.get("dimensions", [])
            metrics_values = row.get("metrics", [])

            if not dimensions or not metrics_values:
                continue

            date_str = dimensions[0]["name"]  # Format: YYYY-MM-DD

            # Extract metrics (order matches request)
            views = int(metrics_values[0]) if len(metrics_values) > 0 else 0
            visits = int(metrics_values[1]) if len(metrics_values) > 1 else 0
            users = int(metrics_values[2]) if len(metrics_values) > 2 else 0
            avg_time = float(metrics_values[3]) if len(metrics_values) > 3 else 0.0
            depth = float(metrics_values[4]) if len(metrics_values) > 4 else 0.0
            bounce_rate = float(metrics_values[5]) if len(metrics_values) > 5 else 0.0
            new_visits_pct = (
                float(metrics_values[6]) if len(metrics_values) > 6 else 0.0
            )

            # Calculate return_rate as (1 - new_visits_pct / 100)
            return_rate = max(0.0, 1.0 - (new_visits_pct / 100.0))

            result[date_str] = {
                "views": views,
                "visits": visits,
                "users": users,
                "avg_time": avg_time,
                "depth": depth,
                "bounce_rate": bounce_rate,
                "return_rate": return_rate,
            }

        return result
