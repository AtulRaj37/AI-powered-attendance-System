from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    role: str
    username: Optional[str] = None
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    name: Optional[str] = None
    roll_number: Optional[str] = None
    department: Optional[str] = None

class UserUpdate(BaseModel):
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    name: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
