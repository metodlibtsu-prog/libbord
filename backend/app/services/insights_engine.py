from app.schemas.dashboard import BehaviorData, EngagementData, KpiOverview
from app.schemas.insights import Insight
from app.schemas.vk import VkKpi


def generate_insights(
    overview: KpiOverview,
    behavior: BehaviorData,
    engagement: EngagementData,
) -> list[Insight]:
    insights: list[Insight] = []

    # Overview insights
    if overview.visits_delta_pct is not None and overview.visits_delta_pct > 20:
        insights.append(Insight(
            block="overview",
            severity="info",
            message=f"Значительный рост визитов (+{overview.visits_delta_pct}%). Проверьте источники трафика.",
        ))
    if overview.visits_delta_pct is not None and overview.visits_delta_pct < -20:
        insights.append(Insight(
            block="overview",
            severity="warning",
            message=f"Заметное снижение визитов ({overview.visits_delta_pct}%). Требует внимания.",
        ))

    # Behavior insights
    if behavior.counters:
        # Check average bounce rate across all counters
        avg_bounce = sum(c.current_bounce_rate for c in behavior.counters) / len(behavior.counters)
        if avg_bounce > 60:
            insights.append(Insight(
                block="behavior",
                severity="warning",
                message=f"Высокий показатель отказов ({avg_bounce:.1f}%). Возможно, проблемы с контентом или навигацией.",
            ))

    if behavior.avg_time_delta_pct is not None and behavior.avg_time_delta_pct < -15:
        insights.append(Insight(
            block="behavior",
            severity="alert",
            message=f"Пользователи стали меньше взаимодействовать с ресурсом (среднее время снизилось на {abs(behavior.avg_time_delta_pct)}%).",
        ))

    if behavior.depth_delta_pct is not None and behavior.depth_delta_pct < -10:
        insights.append(Insight(
            block="behavior",
            severity="warning",
            message="Глубина просмотра снижается. Пользователи просматривают меньше страниц.",
        ))

    if behavior.return_rate_delta_pct is not None and behavior.return_rate_delta_pct > 10:
        insights.append(Insight(
            block="behavior",
            severity="info",
            message=f"Доля возвращающихся пользователей растёт (+{behavior.return_rate_delta_pct}%). Хороший сигнал лояльности.",
        ))

    # Engagement insights
    views_growing = overview.views_delta_pct is not None and overview.views_delta_pct > 10
    engagement_flat = (
        engagement.likes_delta_pct is not None
        and engagement.likes_delta_pct <= 0
        and engagement.comments_delta_pct is not None
        and engagement.comments_delta_pct <= 0
    )
    if views_growing and engagement_flat:
        insights.append(Insight(
            block="engagement",
            severity="info",
            message="Рост охвата без вовлечения — проверьте формат контента.",
        ))

    return insights


def generate_vk_insights(kpis: VkKpi) -> list[dict]:
    """
    Generate VK-specific insights based on KPIs

    Returns list of insight dicts with keys: severity, message
    """
    insights: list[dict] = []

    # Reach and engagement correlation
    reach_delta = kpis.reach_delta_pct
    er_delta = kpis.er_delta_pct

    if reach_delta is not None and er_delta is not None:
        if reach_delta < -10 and er_delta > 5:
            insights.append(
                {
                    "severity": "info",
                    "message": f"Охват снизился на {abs(reach_delta):.1f}%, но вовлечённость выросла на {er_delta:.1f}% — аудитория стала меньше, но активнее",
                }
            )
        elif reach_delta > 10 and er_delta < -5:
            insights.append(
                {
                    "severity": "warning",
                    "message": f"Охват вырос на {reach_delta:.1f}%, но вовлечённость снизилась на {abs(er_delta):.1f}% — контент не резонирует с новой аудиторией",
                }
            )

    # Subscribers growth
    subscribers_delta = kpis.subscribers_delta_pct
    if subscribers_delta is not None:
        if subscribers_delta > 3:
            insights.append(
                {
                    "severity": "info",
                    "message": f"Прирост подписчиков +{subscribers_delta:.1f}% — хороший результат при текущем охвате",
                }
            )
        elif subscribers_delta < -5:
            insights.append(
                {
                    "severity": "warning",
                    "message": f"Отток подписчиков {subscribers_delta:.1f}% — проверьте качество контента",
                }
            )

    # High engagement rate
    er_pct = kpis.er_pct
    if er_pct > 10:
        insights.append(
            {
                "severity": "info",
                "message": f"Высокая вовлечённость {er_pct:.1f}% — контент резонирует с аудиторией",
            }
        )
    elif er_pct < 2:
        insights.append(
            {
                "severity": "alert",
                "message": f"Низкая вовлечённость {er_pct:.1f}% — контент не вызывает интереса. Попробуйте новые форматы (истории, клипы, опросы)",
            }
        )

    # Reposts analysis
    if kpis.reposts > 0:
        reposts_ratio = kpis.reposts / (kpis.comments + 1)  # Avoid division by zero
        if reposts_ratio > 0.5:
            insights.append(
                {
                    "severity": "info",
                    "message": "Высокий уровень репостов — контент имеет виральный потенциал",
                }
            )

    # Comments analysis
    if kpis.reach > 0:
        comments_ratio = kpis.comments / kpis.reach * 100
        if comments_ratio > 1:
            insights.append(
                {
                    "severity": "info",
                    "message": "Активные обсуждения в комментариях — вовлечённая аудитория",
                }
            )

    # Views-to-reach ratio
    views_delta = kpis.views_delta_pct
    if views_delta is not None and reach_delta is not None:
        if views_delta > 15 and reach_delta < 5:
            insights.append(
                {
                    "severity": "info",
                    "message": "Просмотры растут быстрее охвата — пользователи возвращаются к контенту",
                }
            )

    return insights
