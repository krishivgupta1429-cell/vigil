from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Contact(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    phone: str | None = None
    telegram_chat_id: str | None = None
    created_at: datetime = Field(default_factory=utcnow)


class Journey(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    status: str = "active"  # active | completed | alert
    destination_lat: float | None = None
    destination_lng: float | None = None
    started_at: datetime = Field(default_factory=utcnow)
    ended_at: datetime | None = None


class Ping(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    journey_id: int = Field(foreign_key="journey.id", index=True)
    lat: float
    lng: float
    speed: float | None = None
    ts: datetime = Field(default_factory=utcnow)


class Alert(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    journey_id: int | None = Field(default=None, foreign_key="journey.id", index=True)
    kind: str  # sos | deviation | long_stop | motion_spike | missed_checkin
    message: str = ""
    ts: datetime = Field(default_factory=utcnow)
    resolved: bool = False


class Incident(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    started_at: datetime = Field(default_factory=utcnow)
    notes: str = ""


class EvidenceChunk(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    incident_id: int = Field(foreign_key="incident.id", index=True)
    filename: str
    sha256: str
    prev_hash: str
    chain_hash: str
    ts: datetime = Field(default_factory=utcnow)


class CommunityReport(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    lat: float
    lng: float
    category: str  # poor_lighting | harassment | unsafe_stop | other
    note: str = ""
    ts: datetime = Field(default_factory=utcnow)
