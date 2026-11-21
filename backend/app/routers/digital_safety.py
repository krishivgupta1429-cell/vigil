from fastapi import APIRouter

router = APIRouter(prefix="/digital-safety", tags=["digital_safety"])


@router.get("")
def placeholder() -> dict[str, str]:
    return {"module": "digital_safety", "status": "not implemented"}
