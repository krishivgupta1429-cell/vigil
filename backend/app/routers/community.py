from fastapi import APIRouter

router = APIRouter(prefix="/community", tags=["community"])


@router.get("")
def placeholder() -> dict[str, str]:
    return {"module": "community", "status": "not implemented"}
