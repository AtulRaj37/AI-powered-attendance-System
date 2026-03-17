from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
import os

from app.api.api import api_router
from app.core.config import settings
from app.db.session import engine
from app.models.base import Base

def get_application() -> FastAPI:
    _app = FastAPI(title=settings.PROJECT_NAME)

    cors_origins_raw = os.getenv("CORS_ORIGINS", "*")
    if cors_origins_raw == "*":
        allowed_origins = ["*"]
    else:
        allowed_origins = [o.strip() for o in cors_origins_raw.split(",")]

    _app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    _app.include_router(api_router, prefix=settings.API_V1_STR)

    os.makedirs("uploads", exist_ok=True)
    _app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    return _app

app = get_application()

@app.on_event("startup")
def on_startup():
    print("[INFO] Starting up API and initializing DB...")
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
    except Exception as e:
        print(f"[WARNING] Could not create 'vector' extension. Error: {e}")
        print("[WARNING] You may need to install pgvector and create the extension manually in Postgres.")

    Base.metadata.create_all(bind=engine)
    print("[INFO] Database tables created.")

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Powered Attendance System API"}
