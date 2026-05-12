import os
import uuid
from datetime import date
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.dashboard import Period
from app.services import dashboard_service

router = APIRouter(prefix="/api/ai", tags=["ai"])

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-flash-1.5")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    library_id: uuid.UUID
    period: Period = Period.month
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str


def _build_system_prompt(
    library_name: str,
    period_label: str,
    views: int,
    visits: int,
    users: int,
    views_delta: float | None,
    visits_delta: float | None,
    users_delta: float | None,
    resources: list[dict],
    bounce_min: str,
    bounce_max: str,
    avg_depth: float,
    avg_time: float,
    return_rate: float,
    vk_subscribers: int,
    vk_likes: int,
    vk_reposts: int,
    vk_comments: int,
    insights: list[str],
) -> str:
    resources_text = "\n".join(
        f"- {r['name']}: {r['views']:,} просмотров, {r['visits']:,} визитов"
        for r in resources[:10]
    )
    insights_text = "\n".join(f"- {ins}" for ins in insights) if insights else "- Нет автоматических инсайтов"

    def delta_str(d: float | None) -> str:
        if d is None:
            return "нет данных"
        sign = "+" if d > 0 else ""
        return f"{sign}{d:.1f}%"

    return f"""Ты — AI-аналитик дашборда Libboard для {library_name}.
Отвечай по-русски, кратко и конкретно. Максимум 5–6 предложений или маркированный список.
Опирайся ТОЛЬКО на данные ниже. Если данных не хватает — скажи об этом.

ДАННЫЕ ДАШБОРДА за период: {period_label}

## Пульс аудитории
- Просмотры: {views:,} ({delta_str(views_delta)} к пред. периоду)
- Визиты: {visits:,} ({delta_str(visits_delta)})
- Уникальные посетители: {users:,} ({delta_str(users_delta)})
- Конверсия просмотр→визит: {visits/views*100:.1f}% {"(норма 35–50%)" if views > 0 else ""}
- Уникальность: {users/visits*100:.1f}% {"(норма 80–95%)" if visits > 0 else ""}

## Цифровые ресурсы (топ по просмотрам)
{resources_text if resources_text else "- Нет данных"}

## Поведение пользователей
- Показатель отказов: мин {bounce_min}, макс {bounce_max}
- Средняя глубина: {avg_depth:.1f} стр.
- Среднее время: {avg_time:.0f} с.
- Возвраты: {return_rate:.2f}%

## ВКонтакте
- Подписчики: {vk_subscribers:,}, Лайки: {vk_likes:,}, Репосты: {vk_reposts:,}, Комментарии: {vk_comments:,}

## Автоматические инсайты системы
{insights_text}

Если спрашивают отчёт — структурируй с заголовками Markdown."""


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI-аналитик не настроен. Добавьте OPENROUTER_API_KEY в переменные окружения.",
        )

    library_id = req.library_id

    # Gather dashboard context
    overview = None
    channels = []
    behavior = None
    insight_objs = []
    try:
        from app.services.insights_engine import generate_insights
        overview = await dashboard_service.get_overview(
            db, library_id, req.period, None, req.date_from, req.date_to
        )
        channels = await dashboard_service.get_channels(
            db, library_id, req.period, req.date_from, req.date_to
        )
        behavior = await dashboard_service.get_behavior(
            db, library_id, req.period, None, req.date_from, req.date_to
        )
        engagement = await dashboard_service.get_engagement(
            db, library_id, req.period, req.date_from, req.date_to
        )
        insight_objs = generate_insights(overview, behavior, engagement)
    except Exception:
        pass

    # Library name
    try:
        from app.models.library import Library
        from sqlalchemy import select
        lib_row = (await db.execute(select(Library).where(Library.id == library_id))).scalar_one_or_none()
        library_name = lib_row.name if lib_row else "библиотеки"
    except Exception:
        library_name = "библиотеки"

    # Period label
    period_label = req.period.value
    if req.date_from and req.date_to:
        period_label = f"{req.date_from} — {req.date_to}"

    # Resources
    resources = [
        {
            "name": ch.custom_name or ch.channel_type,
            "views": ch.views,
            "visits": ch.visits,
        }
        for ch in sorted(channels, key=lambda c: -c.views)
        if ch.channel_type != "vk"
    ]

    # Behavior
    bounce_min = "—"
    bounce_max = "—"
    avg_depth = 0.0
    avg_time = 0.0
    return_rate = 0.0
    if behavior and behavior.counters:
        rates = [c.current_bounce_rate for c in behavior.counters]
        bounce_min = f"{min(rates):.1f}%"
        bounce_max = f"{max(rates):.1f}%"
        avg_depth = sum(c.current_depth for c in behavior.counters) / len(behavior.counters)
        avg_time = sum(c.current_avg_time for c in behavior.counters) / len(behavior.counters)
        return_rate = sum(c.current_return_rate for c in behavior.counters) / len(behavior.counters)

    # VK — query engagement and subscriber metrics directly
    vk_subscribers = 0
    vk_likes = 0
    vk_reposts = 0
    vk_comments = 0
    try:
        from app.models.engagement_metric import EngagementMetric
        from app.models.vk_metric import VkMetric
        from app.services.period import resolve_period_or_custom as _rpc
        from sqlalchemy import func, select as _sel
        d_from, d_to, _, _ = _rpc(req.period, req.date_from, req.date_to)
        eng_row = (await db.execute(
            _sel(
                func.coalesce(func.sum(EngagementMetric.likes), 0),
                func.coalesce(func.sum(EngagementMetric.reposts), 0),
                func.coalesce(func.sum(EngagementMetric.comments), 0),
            ).where(
                EngagementMetric.library_id == library_id,
                EngagementMetric.date >= d_from,
                EngagementMetric.date <= d_to,
            )
        )).one()
        vk_likes, vk_reposts, vk_comments = eng_row[0], eng_row[1], eng_row[2]
        sub_row = (await db.execute(
            _sel(func.coalesce(func.max(VkMetric.total_subscribers), 0))
            .where(
                VkMetric.library_id == library_id,
                VkMetric.date >= d_from,
                VkMetric.date <= d_to,
            )
        )).scalar()
        vk_subscribers = sub_row or 0
    except Exception:
        pass

    insights_text = [ins.message for ins in insight_objs]

    system_prompt = _build_system_prompt(
        library_name=library_name,
        period_label=period_label,
        views=overview.views if overview else 0,
        visits=overview.visits if overview else 0,
        users=overview.users if overview else 0,
        views_delta=overview.views_delta_pct if overview else None,
        visits_delta=overview.visits_delta_pct if overview else None,
        users_delta=overview.users_delta_pct if overview else None,
        resources=resources,
        bounce_min=bounce_min,
        bounce_max=bounce_max,
        avg_depth=avg_depth,
        avg_time=avg_time,
        return_rate=return_rate,
        vk_subscribers=vk_subscribers,
        vk_likes=vk_likes,
        vk_reposts=vk_reposts,
        vk_comments=vk_comments,
        insights=insights_text,
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "assistant", "content": "Понял, готов отвечать как AI-аналитик Libboard."},
    ]
    for h in req.history:
        if h.role in ("user", "assistant"):
            messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": req.message})

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://libboard.app",
                "X-Title": "Libboard AI Analyst",
            },
            json={
                "model": OPENROUTER_MODEL,
                "messages": messages,
                "max_tokens": 1024,
                "temperature": 0.4,
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"OpenRouter error: {resp.text[:200]}")

    body = resp.json()
    reply = body["choices"][0]["message"]["content"]
    return ChatResponse(reply=reply)
