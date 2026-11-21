from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.db import create_db_and_tables
from app.routers import (
    community,
    contacts,
    digital_safety,
    evidence,
    journeys,
    safe_routes,
    sos,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Vigil API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")


@api.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


for module in (contacts, journeys, sos, safe_routes, community, evidence, digital_safety):
    api.include_router(module.router)

app.include_router(api)
