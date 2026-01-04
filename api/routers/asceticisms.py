# This is the router for the asceticisms

from fastapi import APIRouter

router = APIRouter()


@router.get("/asceticisms/", tags=["asceticisms"])
async def read_asceticisms():
    return [{"asceticism_id": "1"}, {"asceticism_id": "2"}]


@router.get("/asceticisms/me", tags=["asceticisms"])
async def read_asceticisms_me():
    return {"asceticism_id": "1"}


@router.get("/asceticisms/{asceticism_id}", tags=["asceticisms"])
async def read_asceticisms_by_id(asceticism_id: str):
    return {"asceticism_id": asceticism_id}