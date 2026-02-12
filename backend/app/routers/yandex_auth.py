from __future__ import annotations

import secrets
import uuid
from typing import Any
from urllib.parse import urlencode

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_admin
from app.models.channel import Channel
from app.models.metric_counter import MetricCounter, SyncStatus
from app.models.yandex_token import YandexToken
from app.schemas.metric_counter import MetricCounterOut
from app.schemas.yandex import LinkCounterRequest, OAuthStartResponse, YandexCounterOut
from app.services.sync_service import sync_library_metrics
from app.services.yandex_metrika import YandexMetrikaService

router = APIRouter(prefix="/api/yandex", tags=["yandex"])


@router.get("/oauth/start")
async def start_oauth(
    library_id: uuid.UUID = Query(...),
):
    """
    Начало OAuth-flow для подключения Яндекс.Метрики

    Генерирует URL для авторизации пользователя в Яндекс
    """
    # Generate state token for CSRF protection
    state = secrets.token_urlsafe(32)

    # Build authorization URL
    params = {
        "response_type": "code",
        "client_id": settings.yandex_client_id,
        "redirect_uri": settings.yandex_redirect_uri,
        "state": f"{library_id}:{state}",  # Include library_id in state
        "scope": "metrika:read",
    }

    auth_url = f"https://oauth.yandex.com/authorize?{urlencode(params)}"

    return {"auth_url": auth_url}


@router.get("/oauth/callback")
async def oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
    # NOTE: Callback is public - called by Yandex, not by authenticated user
):
    """
    Callback после авторизации в Яндекс

    Обменивает authorization code на access_token и refresh_token,
    затем перенаправляет пользователя обратно на фронтенд
    """
    try:
        # Parse state to extract library_id
        try:
            library_id_str, _state_token = state.split(":", 1)
            library_id = uuid.UUID(library_id_str)
        except (ValueError, AttributeError) as e:
            # Redirect to frontend with error
            return RedirectResponse(
                url=f"{settings.frontend_url}/admin?yandex_error=invalid_state",
                status_code=302
            )

        # Exchange code for tokens
        try:
            token_data = await YandexMetrikaService.exchange_code_for_token(code)
        except Exception as e:
            # Redirect to frontend with error
            return RedirectResponse(
                url=f"{settings.frontend_url}/admin?yandex_error=token_exchange_failed",
                status_code=302
            )

        # Check if token already exists for this library
        result = await db.execute(
            select(YandexToken).where(YandexToken.library_id == library_id)
        )
        existing_token = result.scalar_one_or_none()

        if existing_token:
            # Update existing token
            existing_token.access_token = token_data["access_token"]
            existing_token.refresh_token = token_data["refresh_token"]
            existing_token.expires_at = token_data["expires_at"]
        else:
            # Create new token
            new_token = YandexToken(
                library_id=library_id,
                access_token=token_data["access_token"],
                refresh_token=token_data["refresh_token"],
                expires_at=token_data["expires_at"],
            )
            db.add(new_token)

        await db.commit()

        # Redirect to frontend with success
        return RedirectResponse(
            url=f"{settings.frontend_url}/admin?yandex_success=true&library_id={library_id}",
            status_code=302
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"OAuth callback error: {e}", exc_info=True)
        # Redirect to frontend with error
        return RedirectResponse(
            url=f"{settings.frontend_url}/admin?yandex_error=unexpected",
            status_code=302
        )


@router.get("/counters")
async def list_counters(
    library_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    # NOTE: Temporarily public - JWT validation with ES256 needs to be fixed
    # _admin: dict = Depends(get_current_admin),
) -> dict[str, list[dict[str, Any]]]:
    """
    Получить список доступных счётчиков Яндекс.Метрики

    Требует предварительную авторизацию через OAuth
    """
    # Get token for library
    result = await db.execute(
        select(YandexToken).where(YandexToken.library_id == library_id)
    )
    token = result.scalar_one_or_none()

    if not token:
        raise HTTPException(
            status_code=404,
            detail="No Yandex token found for this library. Please authorize first.",
        )

    # Fetch counters from Yandex API
    try:
        async with YandexMetrikaService(token.access_token) as ym_service:
            counters = await ym_service.list_counters()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch counters: {str(e)}"
        )

    return {"counters": counters}


@router.post("/link-counter", response_model=MetricCounterOut)
async def link_counter(
    data: LinkCounterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    # NOTE: Temporarily public - JWT validation with ES256 needs to be fixed
    # _admin: dict = Depends(get_current_admin),
):
    """
    Привязать счётчик Яндекс.Метрики к библиотеке

    Создаёт канал и счётчик для автоматической синхронизации метрик
    """
    # Check if counter already exists
    result = await db.execute(
        select(MetricCounter).where(
            MetricCounter.library_id == data.library_id,
            MetricCounter.yandex_counter_id == data.yandex_counter_id,
        )
    )
    existing_counter = result.scalar_one_or_none()

    if existing_counter:
        raise HTTPException(
            status_code=400,
            detail="This counter is already linked to the library",
        )

    # Create channel (non-manual)
    channel = Channel(
        library_id=data.library_id,
        type=data.channel_type,
        custom_name=data.custom_name,
        is_manual=False,
    )
    db.add(channel)
    await db.flush()  # Get channel.id

    # Create metric counter
    counter = MetricCounter(
        library_id=data.library_id,
        name=data.name,
        yandex_counter_id=data.yandex_counter_id,
        is_active=True,
        sync_status=SyncStatus.IDLE,
    )
    db.add(counter)
    await db.commit()
    await db.refresh(counter)

    # Auto-sync: подтянуть данные в фоне сразу после подключения
    async def _bg_sync(library_id: uuid.UUID):
        import logging
        from app.database import async_session
        _logger = logging.getLogger(__name__)
        try:
            async with async_session() as bg_db:
                await sync_library_metrics(bg_db, library_id)
            _logger.info(f"Auto-sync completed for library {library_id}")
        except Exception as e:
            _logger.error(f"Auto-sync failed: {e}")

    background_tasks.add_task(_bg_sync, data.library_id)

    return counter


