from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum as SQLEnum, Date, Time
from sqlalchemy.orm import relationship
import enum
import datetime
from app.models.base import Base

class SessionStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"

class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    date = Column(Date, default=datetime.date.today, nullable=False)
    start_time = Column(Time, default=datetime.datetime.utcnow().time, nullable=False)
    end_time = Column(Time, nullable=True)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.ACTIVE, nullable=False)
    
    subject = relationship("Subject", back_populates="sessions")
    attendances = relationship("AttendanceLog", back_populates="session", cascade="all, delete-orphan")
