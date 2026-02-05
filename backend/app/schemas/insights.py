from pydantic import BaseModel


class Insight(BaseModel):
    block: str  # "overview" | "channels" | "behavior" | "engagement"
    severity: str  # "info" | "warning" | "alert"
    message: str
