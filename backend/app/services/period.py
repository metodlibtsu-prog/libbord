from datetime import date, timedelta

from app.schemas.dashboard import Period


def resolve_period(period: Period) -> tuple[date, date, date, date]:
    """Return (date_from, date_to, prev_from, prev_to) for the given period preset."""
    today = date.today()

    if period == Period.today:
        date_from = today
        date_to = today
    elif period == Period.yesterday:
        date_from = today - timedelta(days=1)
        date_to = today - timedelta(days=1)
    elif period == Period.week:
        date_from = today - timedelta(days=6)
        date_to = today
    elif period == Period.month:
        date_from = today - timedelta(days=29)
        date_to = today
    elif period == Period.quarter:
        date_from = today - timedelta(days=89)
        date_to = today
    elif period == Period.year:
        date_from = today - timedelta(days=364)
        date_to = today
    else:
        date_from = today - timedelta(days=29)
        date_to = today

    duration = (date_to - date_from).days + 1
    prev_to = date_from - timedelta(days=1)
    prev_from = prev_to - timedelta(days=duration - 1)

    return date_from, date_to, prev_from, prev_to


def calc_delta_pct(current: float, previous: float) -> float | None:
    """Calculate percentage change. Returns None if previous is 0."""
    if previous == 0:
        return None
    return round((current - previous) / previous * 100, 1)
