from fastapi import APIRouter
from app.api.endpoints import students, attendance, auth, sessions, subjects

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(students.router, prefix="/students", tags=["Students"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
