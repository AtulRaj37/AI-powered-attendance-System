from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class StudentBase(BaseModel):
    name: str
    roll_number: str
    department: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentInDBBase(StudentBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class Student(StudentInDBBase):
    face_embedding_count: int = 0
    face_image_url: Optional[str] = None

class MatchResult(BaseModel):
    student_id: Optional[int] = None
    name: str
    roll_number: Optional[str] = None
    confidence: float
    distance: float
