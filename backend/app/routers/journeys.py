from fastapi import APIRouter

router = APIRouter(prefix="/journeys", tags=["journeys"])


@router.get("")
def placeholder() -> dict[str, str]:
    return {"module": "journeys", "status": "not implemented"}
