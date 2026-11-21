from fastapi import APIRouter

router = APIRouter(prefix="/safe-routes", tags=["safe_routes"])


@router.get("")
def placeholder() -> dict[str, str]:
    return {"module": "safe_routes", "status": "not implemented"}
