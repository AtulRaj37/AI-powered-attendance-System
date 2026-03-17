from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UnknownFaceBase(BaseModel):
    image_path: str
    camera_id: Optional[str] = None

class UnknownFaceCreate(UnknownFaceBase):
    pass

class UnknownFaceInDBBase(UnknownFaceBase):
    id: int
    detected_at: datetime
    
    class Config:
        from_attributes = True

class UnknownFace(UnknownFaceInDBBase):
    pass
