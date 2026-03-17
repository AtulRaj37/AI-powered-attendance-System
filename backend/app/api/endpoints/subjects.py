from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

from app.db.session import get_db
from app.api import deps
from app.models.subject import Subject
from app.models.class_session import ClassSession, SessionStatus
from app.models.attendance import AttendanceLog, AttendanceStatus
from app.models.student import Student
from app.models.face_embedding import FaceEmbedding
from app.schemas.subject import SubjectCreate, Subject as SubjectSchema

router = APIRouter()

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None

@router.get("/stats")
def get_teacher_stats(
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    from datetime import date, timedelta
    from datetime import datetime

    today = date.today()
    teacher_subject_ids = [
        s.id for s in db.query(Subject).filter(Subject.teacher_id == current_user.id).all()
    ]
    today_sessions = db.query(ClassSession).filter(
        ClassSession.subject_id.in_(teacher_subject_ids),
        ClassSession.date == today
    ).count() if teacher_subject_ids else 0

    active_sessions = db.query(ClassSession).filter(
        ClassSession.subject_id.in_(teacher_subject_ids),
        ClassSession.status == SessionStatus.ACTIVE
    ).count() if teacher_subject_ids else 0

    total_students = db.query(Student).count()

    if teacher_subject_ids:
        session_ids = [
            s.id for s in db.query(ClassSession).filter(
                ClassSession.subject_id.in_(teacher_subject_ids)
            ).all()
        ]
        if session_ids:
            total_logs = db.query(AttendanceLog).filter(
                AttendanceLog.session_id.in_(session_ids)
            ).count()
            present_logs = db.query(AttendanceLog).filter(
                AttendanceLog.session_id.in_(session_ids),
                AttendanceLog.status == AttendanceStatus.PRESENT
            ).count()
            avg_attendance = round((present_logs / total_logs * 100), 1) if total_logs > 0 else 0
        else:
            avg_attendance = 0
    else:
        avg_attendance = 0

    total_subjects = len(teacher_subject_ids)

    week_start = today - timedelta(days=today.weekday())
    sessions_this_week = db.query(ClassSession).filter(
        ClassSession.subject_id.in_(teacher_subject_ids),
        ClassSession.date >= week_start,
        ClassSession.date <= today
    ).count() if teacher_subject_ids else 0

    return {
        "today_sessions": today_sessions,
        "active_sessions": active_sessions,
        "total_students": total_students,
        "avg_attendance": avg_attendance,
        "total_subjects": total_subjects,
        "sessions_this_week": sessions_this_week,
    }

@router.get("/", response_model=List[dict])
def get_my_subjects(db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_teacher)):
    subjects = db.query(Subject).filter(Subject.teacher_id == current_user.id).all()
    result = []
    for s in subjects:
        session_count = db.query(ClassSession).filter(ClassSession.subject_id == s.id).count()
        total_students = db.query(Student).count()
        has_active = db.query(ClassSession).filter(
            ClassSession.subject_id == s.id,
            ClassSession.status == SessionStatus.ACTIVE
        ).first()

        last_session = db.query(ClassSession).filter(
            ClassSession.subject_id == s.id,
            ClassSession.status == SessionStatus.COMPLETED
        ).order_by(ClassSession.date.desc()).first()

        all_session_ids = [sess.id for sess in db.query(ClassSession).filter(ClassSession.subject_id == s.id).all()]
        total_possible = len(all_session_ids) * total_students if all_session_ids and total_students else 0
        present_count = db.query(AttendanceLog).filter(
            AttendanceLog.session_id.in_(all_session_ids),
            AttendanceLog.status == AttendanceStatus.PRESENT
        ).count() if all_session_ids else 0
        attendance_rate = round(present_count / total_possible * 100, 1) if total_possible > 0 else 0

        if has_active:
            session_status = "ACTIVE"
        elif last_session:
            session_status = "COMPLETED"
        else:
            session_status = "INACTIVE"

        result.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "department": s.department,
            "semester": s.semester,
            "session_count": session_count,
            "total_students": total_students,
            "has_active_session": has_active is not None,
            "active_session_id": has_active.id if has_active else None,
            "attendance_rate": attendance_rate,
            "last_session_date": str(last_session.date) if last_session else None,
            "session_status": session_status,
        })
    return result

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_subject(
    subject_in: dict,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    try:
        new_subj = Subject(
            name=subject_in.get("name"),
            code=subject_in.get("code"),
            department=subject_in.get("department"),
            semester=subject_in.get("semester"),
            teacher_id=current_user.id
        )
        db.add(new_subj)
        db.commit()
        db.refresh(new_subj)
        return {
            "id": new_subj.id,
            "name": new_subj.name,
            "code": new_subj.code,
            "department": new_subj.department,
            "semester": new_subj.semester,
        }
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="A subject with this course code already exists.")

@router.put("/{subject_id}")
def update_subject(
    subject_id: int,
    update: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    subj = db.query(Subject).filter(Subject.id == subject_id, Subject.teacher_id == current_user.id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    if update.name is not None:
        subj.name = update.name
    if update.code is not None:
        subj.code = update.code
    if update.department is not None:
        subj.department = update.department
    if update.semester is not None:
        subj.semester = update.semester
    db.commit()
    db.refresh(subj)
    return {"id": subj.id, "name": subj.name, "code": subj.code, "department": subj.department, "semester": subj.semester}

@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    subj = db.query(Subject).filter(Subject.id == subject_id, Subject.teacher_id == current_user.id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subj)
    db.commit()
    return {"msg": f"Subject {subject_id} deleted"}

@router.get("/{subject_id}/sessions")
def get_subject_sessions(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    subj = db.query(Subject).filter(Subject.id == subject_id, Subject.teacher_id == current_user.id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")

    sessions = db.query(ClassSession).filter(
        ClassSession.subject_id == subject_id
    ).order_by(ClassSession.date.desc()).all()

    result = []
    for s in sessions:
        present_count = db.query(AttendanceLog).filter(
            AttendanceLog.session_id == s.id,
            AttendanceLog.status == AttendanceStatus.PRESENT
        ).count()
        total_students = db.query(Student).count()
        result.append({
            "session_id": s.id,
            "date": str(s.date),
            "start_time": str(s.start_time) if s.start_time else None,
            "end_time": str(s.end_time) if s.end_time else None,
            "status": s.status,
            "present_count": present_count,
            "total_students": total_students,
        })
    return result

@router.get("/{subject_id}/reports")
def get_subject_reports(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    sessions = db.query(ClassSession).filter(
        ClassSession.subject_id == subject_id
    ).order_by(ClassSession.date.desc()).all()

    report = []
    for s in sessions:
        present_count = db.query(func.count(AttendanceLog.id)).filter(
            AttendanceLog.session_id == s.id,
            AttendanceLog.status == AttendanceStatus.PRESENT
        ).scalar()

        report.append({
            "session_id": s.id,
            "date": str(s.date),
            "status": s.status,
            "present_count": present_count or 0
        })

    return report

@router.get("/{subject_id}/student-rankings")
def get_subject_student_rankings(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    session_ids = [
        s.id for s in db.query(ClassSession).filter(ClassSession.subject_id == subject_id).all()
    ]
    total_sessions = len(session_ids)
    students = db.query(Student).all()
    result = []
    for student in students:
        present_count = db.query(AttendanceLog).filter(
            AttendanceLog.student_id == student.id,
            AttendanceLog.session_id.in_(session_ids),
            AttendanceLog.status == AttendanceStatus.PRESENT
        ).count() if session_ids else 0
        attendance_pct = round(present_count / total_sessions * 100, 1) if total_sessions > 0 else 0
        result.append({
            "student_id": student.id,
            "name": student.name,
            "roll_number": student.roll_number,
            "department": student.department,
            "present_sessions": present_count,
            "total_sessions": total_sessions,
            "attendance_pct": attendance_pct,
        })
    result.sort(key=lambda x: x["attendance_pct"], reverse=True)
    return result
