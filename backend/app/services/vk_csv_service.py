"""
VK CSV Parser Service

Parses VK community statistics CSV exports and maps metrics to database models.
"""

import csv
from collections import defaultdict
from datetime import date, datetime
from typing import Dict, List, Tuple


# Mapping of VK CSV metric names to VkMetric model fields
VK_METRIC_MAPPING = {
    "Посетители": "visitors",
    "Просмотры": "views",
    "Посты": "posts",
    "Истории": "stories",
    "Клипы": "clips",
    "Видео": "videos",
    "Подписались": "subscribed",
    "Отписались": "unsubscribed",
    "Всего подписчиков": "total_subscribers",
    "Перейти на сайт": "site_clicks",
}

# Mapping for engagement metrics (stored in engagement_metrics table)
ENGAGEMENT_METRIC_MAPPING = {
    "Лайки": "likes",
    "Репосты": "reposts",
    "Комментарии": "comments",
}


class VkDailyMetrics:
    """Container for daily VK metrics"""

    def __init__(self, date_obj: date):
        self.date = date_obj
        # VK-specific metrics
        self.visitors = 0
        self.views = 0
        self.posts = 0
        self.stories = 0
        self.clips = 0
        self.videos = 0
        self.subscribed = 0
        self.unsubscribed = 0
        self.total_subscribers = 0
        self.site_clicks = 0
        # Engagement metrics
        self.likes = 0
        self.reposts = 0
        self.comments = 0

    def add_metric(self, metric_name: str, value: int):
        """Add metric value"""
        # VK metrics
        if metric_name in VK_METRIC_MAPPING:
            field_name = VK_METRIC_MAPPING[metric_name]
            setattr(self, field_name, getattr(self, field_name, 0) + value)
        # Engagement metrics
        elif metric_name in ENGAGEMENT_METRIC_MAPPING:
            field_name = ENGAGEMENT_METRIC_MAPPING[metric_name]
            setattr(self, field_name, getattr(self, field_name, 0) + value)


def parse_vk_csv(file_path: str) -> Dict[date, VkDailyMetrics]:
    """
    Parse VK CSV export and aggregate metrics by date

    Args:
        file_path: Path to CSV file

    Returns:
        Dictionary mapping date -> VkDailyMetrics

    CSV structure (delimiter=';'):
    [0] Раздел
    [1] Подраздел
    [2] Дата (DD.MM.YYYY)
    [3] Время
    [4] Вид данных
    [5] Сортировка: гранулярность
    [6] Сортировка: вид разреза
    [7] Параметр легенды (metric name)
    [8] Значение (metric value)
    """
    daily_metrics: Dict[date, VkDailyMetrics] = {}

    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")
        next(reader)  # Skip header

        for row in reader:
            if len(row) < 9:
                continue

            date_str = row[2]
            metric_name = row[7]
            value_str = row[8]

            try:
                # Parse date
                date_obj = datetime.strptime(date_str, "%d.%m.%Y").date()

                # Parse value
                value = int(value_str)

                # Get or create daily metrics container
                if date_obj not in daily_metrics:
                    daily_metrics[date_obj] = VkDailyMetrics(date_obj)

                # Add metric
                daily_metrics[date_obj].add_metric(metric_name, value)

            except (ValueError, IndexError):
                # Skip invalid rows
                continue

    return daily_metrics


def extract_period_from_csv(file_path: str) -> Tuple[date, date]:
    """
    Extract date range from CSV

    Returns:
        (min_date, max_date) tuple
    """
    dates: List[date] = []

    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")
        next(reader)  # Skip header

        for row in reader:
            if len(row) < 3:
                continue

            date_str = row[2]
            try:
                date_obj = datetime.strptime(date_str, "%d.%m.%Y").date()
                dates.append(date_obj)
            except ValueError:
                continue

    if not dates:
        raise ValueError("No valid dates found in CSV")

    return min(dates), max(dates)


def validate_csv_format(file_path: str) -> bool:
    """
    Validate CSV file format

    Returns:
        True if valid, raises ValueError otherwise
    """
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")

        try:
            header = next(reader)
            if len(header) < 9:
                raise ValueError(f"Invalid header: expected 9 columns, got {len(header)}")
        except StopIteration:
            raise ValueError("Empty CSV file")

        # Check first data row
        try:
            first_row = next(reader)
            if len(first_row) < 9:
                raise ValueError(f"Invalid data row: expected 9 columns, got {len(first_row)}")

            # Try to parse date
            datetime.strptime(first_row[2], "%d.%m.%Y")

        except StopIteration:
            raise ValueError("No data rows in CSV")
        except ValueError as e:
            raise ValueError(f"Invalid date format in CSV: {e}")

    return True
