from fastapi import FastAPI

from .routers import asceticisms

app = FastAPI()

app.include_router(asceticisms.router)


@app.get("/")
async def root():
    return {"message": "Hello Bigger Applications!"}