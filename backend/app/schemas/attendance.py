from pydantic import BaseModel
from typing import Optional
from datetime import date, time

class AttendanceBase(BaseModel):
    student_id: int
    confidence: Optional[float] = None
    camera_id: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    date: date
    time: time

class AttendanceInDBBase(AttendanceBase):
    id: int
    date: date
    time: time
    
    class Config:
        from_attributes = True

class Attendance(AttendanceInDBBase):
    pass
