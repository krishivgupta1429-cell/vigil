from fastapi import APIRouter

router = APIRouter(prefix="/sos", tags=["sos"])


@router.get("")
def placeholder() -> dict[str, str]:
    return {"module": "sos", "status": "not implemented"}
