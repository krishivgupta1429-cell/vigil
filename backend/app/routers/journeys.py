"""Journey Mode (M1): start/end a journey, receive pings, public tracking view.

This router has no prefix because it serves two URL groups from one file:
  /api/journeys/...   owner endpoints
  /api/track/{token}  PUBLIC read-only endpoint for the shared link
(main.py is shared and only includes `router`, so both live here.)
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field, field_validator
from sqlmodel import Session, select

from app.db import get_session
from app.models import Journey, Ping, utcnow
from app.models_journey import JourneyShare

router = APIRouter(tags=["journeys"])

MAX_TRACK_PINGS = 200


def as_utc(dt: datetime) -> datetime:
    """SQLite hands back naive datetimes; everything we store is UTC."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


# ---------------------------------------------------------------- owner side


class JourneyCreate(BaseModel):
    destination_lat: float = Field(ge=-90, le=90)
    destination_lng: float = Field(ge=-180, le=180)
    destination_name: str | None = Field(default=None, max_length=200)

    @field_validator("destination_name")
    @classmethod
    def blank_to_none(cls, v: str | None) -> str | None:
        v = v.strip() if v else v
        return v or None


class JourneyOut(BaseModel):
    id: int
    status: str
    destination_lat: float | None
    destination_lng: float | None
    destination_name: str | None
    started_at: datetime
    ended_at: datetime | None
    share_token: str


class PingCreate(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    speed: float | None = Field(default=None, ge=0, le=200)  # metres per second
    # How long ago the phone captured this fix (non-zero for pings queued while
    # offline). Relative on purpose: a wrong phone clock cannot skew the timeline.
    age_ms: int = Field(default=0, ge=0, le=3_600_000)


def _share_for(session: Session, journey: Journey) -> JourneyShare:
    share = session.get(JourneyShare, journey.id)
    if share is None:  # journey created by something else: give it a link lazily
        share = JourneyShare(journey_id=journey.id)
        session.add(share)
        session.commit()
        session.refresh(share)
    return share


def _out(session: Session, journey: Journey) -> JourneyOut:
    share = _share_for(session, journey)
    return JourneyOut(
        id=journey.id,
        status=journey.status,
        destination_lat=journey.destination_lat,
        destination_lng=journey.destination_lng,
        destination_name=share.destination_name,
        started_at=as_utc(journey.started_at),
        ended_at=as_utc(journey.ended_at) if journey.ended_at else None,
        share_token=share.share_token,
    )


def _get_journey(session: Session, journey_id: int) -> Journey:
    journey = session.get(Journey, journey_id)
    if journey is None:
        raise HTTPException(status_code=404, detail="Journey not found")
    return journey


# Declared before "/journeys/{journey_id}/..." so "active" is never read as an id.
@router.get("/journeys/active", response_model=JourneyOut | None)
def get_active_journey(session: Session = Depends(get_session)):
    journey = session.exec(
        select(Journey).where(Journey.status == "active").order_by(Journey.id.desc())
    ).first()
    return _out(session, journey) if journey else None


@router.post("/journeys", response_model=JourneyOut, status_code=status.HTTP_201_CREATED)
def start_journey(body: JourneyCreate, session: Session = Depends(get_session)):
    if session.exec(select(Journey).where(Journey.status == "active")).first() is not None:
        raise HTTPException(status_code=409, detail="A journey is already in progress")
    journey = Journey(
        status="active",
        destination_lat=body.destination_lat,
        destination_lng=body.destination_lng,
    )
    session.add(journey)
    session.commit()
    session.refresh(journey)
    session.add(JourneyShare(journey_id=journey.id, destination_name=body.destination_name))
    session.commit()
    return _out(session, journey)


@router.post("/journeys/{journey_id}/ping")
def add_ping(journey_id: int, body: PingCreate, session: Session = Depends(get_session)):
    journey = _get_journey(session, journey_id)
    if journey.status != "active":
        raise HTTPException(status_code=409, detail="Journey has ended")
    ts = utcnow() - timedelta(milliseconds=body.age_ms)
    session.add(Ping(journey_id=journey_id, lat=body.lat, lng=body.lng, speed=body.speed, ts=ts))
    session.commit()
    return {"ok": True}


@router.post("/journeys/{journey_id}/end", response_model=JourneyOut)
def end_journey(journey_id: int, session: Session = Depends(get_session)):
    journey = _get_journey(session, journey_id)
    if journey.status == "active":
        journey.status = "completed"
        journey.ended_at = utcnow()
        session.add(journey)
        session.commit()
        session.refresh(journey)
    return _out(session, journey)


# ------------------------------------------------------------- public side
# PRIVACY: only what the share link is for (live location of ONE journey).
# Never add contacts, database ids, the token, or any other table here.
# Once the journey ends, location is no longer returned at all.


class PingOut(BaseModel):
    lat: float
    lng: float
    speed: float | None
    ts: datetime


class DestinationOut(BaseModel):
    lat: float | None
    lng: float | None
    name: str | None


class TrackOut(BaseModel):
    status: str
    destination: DestinationOut
    started_at: datetime
    ended_at: datetime | None
    pings: list[PingOut]
    latest: PingOut | None
    # Lets the viewer compute "last updated" without trusting its own clock.
    server_time: datetime


@router.get("/track/{share_token}", response_model=TrackOut)
def track(share_token: str, response: Response, session: Session = Depends(get_session)):
    response.headers["Cache-Control"] = "no-store"
    share = session.exec(select(JourneyShare).where(JourneyShare.share_token == share_token)).first()
    journey = session.get(Journey, share.journey_id) if share else None
    if share is None or journey is None:
        raise HTTPException(status_code=404, detail="This tracking link is not valid")

    pings: list[PingOut] = []
    if journey.status == "active":
        rows = session.exec(
            select(Ping)
            .where(Ping.journey_id == journey.id)
            .order_by(Ping.ts.desc())
            .limit(MAX_TRACK_PINGS)
        ).all()
        pings = [
            PingOut(lat=p.lat, lng=p.lng, speed=p.speed, ts=as_utc(p.ts)) for p in reversed(rows)
        ]

    return TrackOut(
        status=journey.status,
        destination=DestinationOut(
            lat=journey.destination_lat,
            lng=journey.destination_lng,
            name=share.destination_name,
        ),
        started_at=as_utc(journey.started_at),
        ended_at=as_utc(journey.ended_at) if journey.ended_at else None,
        pings=pings,
        latest=pings[-1] if pings else None,
        server_time=as_utc(utcnow()),
    )
