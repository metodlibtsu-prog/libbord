from app.schemas.dashboard import BehaviorData, EngagementData, KpiOverview
from app.schemas.insights import Insight


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
    if behavior.timeline:
        last_bounce = behavior.timeline[-1].bounce_rate
        if last_bounce > 20:
            insights.append(Insight(
                block="behavior",
                severity="warning",
                message=f"Высокий показатель отказов ({last_bounce}%). Возможно, проблемы с контентом или навигацией.",
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
