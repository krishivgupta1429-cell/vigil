from fastapi import APIRouter

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.get("")
def placeholder() -> dict[str, str]:
    return {"module": "evidence", "status": "not implemented"}
