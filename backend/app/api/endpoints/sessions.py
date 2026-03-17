from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.api import deps
from app.models.user import User
from app.models.subject import Subject
from app.models.class_session import ClassSession, SessionStatus
from app.models.attendance import AttendanceLog, AttendanceStatus
from app.models.student import Student

router = APIRouter()

from pydantic import BaseModel

class SessionStartModel(BaseModel):
    subject_id: int
    duration_minutes: int = 60

class SessionEndModel(BaseModel):
    session_id: int

@router.post("/start")
def start_session(
    session_data: SessionStartModel,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_teacher)
):
    subject_id = session_data.subject_id
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.teacher_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found or you don't have access")

    active_session = db.query(ClassSession).filter(
        ClassSession.subject_id == subject_id,
        ClassSession.status == SessionStatus.ACTIVE
    ).first()
    if active_session:
        return {"session_id": active_session.id, "status": "already_active", "msg": "Session is already running"}

    new_session = ClassSession(
        subject_id=subject.id,
        status=SessionStatus.ACTIVE
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return {"session_id": new_session.id, "status": "started", "subject_name": subject.name}

@router.post("/end")
def end_session(
    body: SessionEndModel,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_teacher)
):
    session = db.query(ClassSession).filter(ClassSession.id == body.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = SessionStatus.COMPLETED
    session.end_time = datetime.utcnow().time()
    db.commit()
    return {"msg": f"Session {body.session_id} ended"}

@router.get("/active")
def get_active_sessions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_teacher)
):
    sessions = db.query(ClassSession).join(Subject).filter(
        ClassSession.status == SessionStatus.ACTIVE,
        Subject.teacher_id == current_user.id
    ).all()
    return [{
        "session_id": s.id,
        "subject_id": s.subject_id,
        "subject_name": s.subject.name,
        "start_time": str(s.start_time)
    } for s in sessions]

@router.get("/history")
def get_session_history(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_teacher)
):
    teacher_subject_ids = [
        s.id for s in db.query(Subject).filter(Subject.teacher_id == current_user.id).all()
    ]
    if not teacher_subject_ids:
        return []

    sessions = db.query(ClassSession).filter(
        ClassSession.subject_id.in_(teacher_subject_ids)
    ).order_by(ClassSession.date.desc(), ClassSession.start_time.desc()).all()

    result = []
    for s in sessions:
        present_count = db.query(AttendanceLog).filter(
            AttendanceLog.session_id == s.id,
            AttendanceLog.status == AttendanceStatus.PRESENT
        ).count()
        total_students = db.query(Student).count()
        absent_count = max(0, total_students - present_count)

        duration_str = "—"
        if s.start_time and s.end_time:
            from datetime import timedelta, date
            dt_start = datetime.combine(date.today(), s.start_time)
            dt_end = datetime.combine(date.today(), s.end_time)
            diff = dt_end - dt_start
            mins = int(diff.total_seconds() / 60)
            duration_str = f"{mins} min"

        result.append({
            "session_id": s.id,
            "subject_id": s.subject_id,
            "subject_name": s.subject.name if s.subject else "Unknown",
            "subject_code": s.subject.code if s.subject else "",
            "date": str(s.date),
            "start_time": str(s.start_time) if s.start_time else None,
            "end_time": str(s.end_time) if s.end_time else None,
            "duration": duration_str,
            "status": s.status,
            "present_count": present_count,
            "absent_count": absent_count,
            "total_students": total_students,
        })
    return result

@router.get("/{session_id}/detail")
def get_session_detail(
    session_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_teacher)
):
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    students = db.query(Student).all()
    roster = []
    for student in students:
        log = db.query(AttendanceLog).filter(
            AttendanceLog.student_id == student.id,
            AttendanceLog.session_id == session_id
        ).first()
        roster.append({
            "student_id": student.id,
            "name": student.name,
            "roll_number": student.roll_number,
            "department": student.department,
            "status": log.status if log else "ABSENT",
            "confidence": log.confidence if log else None,
            "timestamp": log.timestamp.strftime("%H:%M:%S") if log and log.timestamp else None,
        })

    present_count = sum(1 for r in roster if r["status"] == "PRESENT")

    return {
        "session_id": session.id,
        "subject_id": session.subject_id,
        "subject_name": session.subject.name if session.subject else "Unknown",
        "subject_code": session.subject.code if session.subject else "",
        "department": session.subject.department if session.subject else "",
        "semester": session.subject.semester if session.subject else "",
        "date": str(session.date),
        "start_time": str(session.start_time) if session.start_time else None,
        "end_time": str(session.end_time) if session.end_time else None,
        "status": session.status,
        "present_count": present_count,
        "total_students": len(roster),
        "roster": roster,
    }
