from sqlalchemy import Column, Integer, String, DateTime
import datetime
from app.models.base import Base

class UnknownFace(Base):
    __tablename__ = "unknown_faces"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String, nullable=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    camera_id = Column(String, nullable=True)
