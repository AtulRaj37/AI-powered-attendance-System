from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api import deps
from app.models.student import Student
from app.models.face_embedding import FaceEmbedding
from app.schemas.student import Student as StudentSchema, StudentCreate
from app.ml.face_detection import detect_faces
from app.ml.face_embedding import generate_embedding
import io
import os
from PIL import Image
import numpy as np

os.makedirs("uploads/students", exist_ok=True)

router = APIRouter()

@router.post("/", response_model=StudentSchema)
def create_student(
    student_in: StudentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    db_student = db.query(Student).filter(Student.roll_number == student_in.roll_number).first()
    if db_student:
        raise HTTPException(status_code=400, detail="Student with this roll number already exists.")
    
    student = Student(
        name=student_in.name,
        roll_number=student_in.roll_number,
        department=student_in.department
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.get("/", response_model=List[dict])
def list_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_teacher)):
    from app.models.attendance import AttendanceLog, AttendanceStatus
    from app.models.class_session import ClassSession

    students = db.query(Student).offset(skip).limit(limit).all()
    total_sessions = db.query(ClassSession).count()

    result = []
    for s in students:
        embedding_count = db.query(FaceEmbedding).filter(FaceEmbedding.student_id == s.id).count()
        face_image_url = f"/uploads/students/{s.id}.jpg" if os.path.exists(f"uploads/students/{s.id}.jpg") else None

        present_logs = db.query(AttendanceLog).filter(
            AttendanceLog.student_id == s.id,
            AttendanceLog.status == AttendanceStatus.PRESENT
        ).all()
        sessions_attended = len(present_logs)
        attendance_pct = round(sessions_attended / total_sessions * 100, 1) if total_sessions > 0 else 0

        last_log = db.query(AttendanceLog).filter(
            AttendanceLog.student_id == s.id
        ).order_by(AttendanceLog.timestamp.desc()).first()
        last_seen = None
        if last_log and last_log.timestamp:
            from datetime import date as ddate
            today = ddate.today()
            log_date = last_log.timestamp.date()
            if log_date == today:
                last_seen = "Today"
            elif (today - log_date).days == 1:
                last_seen = "Yesterday"
            else:
                last_seen = str(log_date)

        result.append({
            "id": s.id,
            "name": s.name,
            "roll_number": s.roll_number,
            "department": s.department,
            "created_at": s.created_at,
            "face_embedding_count": embedding_count,
            "face_image_url": face_image_url,
            "attendance_pct": attendance_pct,
            "last_seen": last_seen,
            "sessions_attended": sessions_attended,
            "total_sessions": total_sessions,
        })
    return result

@router.get("/teacher-stats")
def get_teacher_profile_stats(
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    from app.models.subject import Subject
    from app.models.class_session import ClassSession, SessionStatus
    from app.models.attendance import AttendanceLog, AttendanceStatus

    subjects = db.query(Subject).filter(Subject.teacher_id == current_user.id).all()
    subjects_count = len(subjects)
    subject_ids = [s.id for s in subjects]

    sessions = db.query(ClassSession).filter(
        ClassSession.subject_id.in_(subject_ids)
    ).all() if subject_ids else []
    total_sessions_conducted = len([s for s in sessions if s.status.value == "COMPLETED"])

    session_ids = [s.id for s in sessions]
    if session_ids:
        total_logs = db.query(AttendanceLog).filter(AttendanceLog.session_id.in_(session_ids)).count()
        present_logs = db.query(AttendanceLog).filter(
            AttendanceLog.session_id.in_(session_ids),
            AttendanceLog.status == AttendanceStatus.PRESENT
        ).count()
        avg_attendance = round(present_logs / total_logs * 100, 1) if total_logs > 0 else 0
    else:
        avg_attendance = 0

    return {
        "subjects_teaching": subjects_count,
        "total_sessions_conducted": total_sessions_conducted,
        "avg_attendance": avg_attendance,
    }

@router.get("/{student_id}/profile")
def get_student_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    from app.models.attendance import AttendanceLog, AttendanceStatus
    from app.models.class_session import ClassSession
    from app.models.subject import Subject

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    face_image_url = f"/uploads/students/{student.id}.jpg" if os.path.exists(f"uploads/students/{student.id}.jpg") else None
    embedding_count = db.query(FaceEmbedding).filter(FaceEmbedding.student_id == student.id).count()

    total_sessions = db.query(ClassSession).count()
    logs = db.query(AttendanceLog).filter(AttendanceLog.student_id == student_id).order_by(AttendanceLog.timestamp.desc()).all()

    sessions_attended = sum(1 for l in logs if l.status.value == "PRESENT")
    sessions_missed = total_sessions - sessions_attended
    attendance_pct = round(sessions_attended / total_sessions * 100, 1) if total_sessions > 0 else 0

    history = []
    for log in logs:
        session = db.query(ClassSession).filter(ClassSession.id == log.session_id).first()
        subject = db.query(Subject).filter(Subject.id == session.subject_id).first() if session else None
        history.append({
            "date": str(session.date) if session else "Unknown",
            "subject": subject.name if subject else "Unknown",
            "subject_code": subject.code if subject else "",
            "status": log.status,
            "time_marked": log.timestamp.strftime("%H:%M") if log.timestamp else None,
        })

    return {
        "id": student.id,
        "name": student.name,
        "roll_number": student.roll_number,
        "department": student.department,
        "face_image_url": face_image_url,
        "face_registered": embedding_count > 0,
        "attendance_pct": attendance_pct,
        "total_sessions": total_sessions,
        "sessions_attended": sessions_attended,
        "sessions_missed": sessions_missed,
        "history": history,
    }

@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_teacher)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db.delete(student)
    db.commit()
    return {"detail": "Student deleted"}

@router.post("/{student_id}/register-face")
async def register_face(
    student_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    embeddings_added = 0
    errors = []

    for file in files:
        contents = await file.read()
        image_stream = io.BytesIO(contents)
        try:
            img = Image.open(image_stream).convert('RGB')
            img_array = np.array(img)
            print(f"[REGISTER] Processing image: {file.filename}, shape={img_array.shape}")
            
            face_locations = detect_faces(img_array)
            print(f"[REGISTER] Detected {len(face_locations)} face(s) in uploaded image.")
            if len(face_locations) == 0:
                errors.append(f"{file.filename}: No face detected. Ensure your face is clearly visible and well-lit.")
                continue
            if len(face_locations) > 1:
                errors.append(f"{file.filename}: Found {len(face_locations)} faces, expected exactly 1. Please ensure only the student is in frame.")
                continue
                
            top, right, bottom, left = face_locations[0]
            
            pad = 20
            h, w, _ = img_array.shape
            crop = img_array[max(0, top-pad):min(h, bottom+pad), max(0, left-pad):min(w, right+pad)]
            preview_path = f"uploads/students/{student.id}.jpg"
            Image.fromarray(crop).save(preview_path)
            print(f"[REGISTER] Saved face preview image to {preview_path}")
            
            embedding = generate_embedding(img_array, face_locations[0])
            print(f"[REGISTER] Embedding generated: {embedding is not None}")
            if embedding is not None:
                new_embedding = FaceEmbedding(
                    student_id=student.id,
                    embedding_vector=embedding.tolist()
                )
                db.add(new_embedding)
                embeddings_added += 1
                print(f"[REGISTER] ✅ Successfully registered face for student_id={student.id}")
            else:
                errors.append(f"{file.filename}: Failed to generate embedding.")
        except Exception as e:
            errors.append(f"{file.filename}: Error processing image ({str(e)}).")
            print(f"[REGISTER] ❌ Exception: {e}")

    if embeddings_added > 0:
        db.commit()
    
    result_msg = f"Successfully registered {embeddings_added} face(s) for {student.name}."
    if errors:
        result_msg += f" Errors: {'; '.join(errors)}"
    print(f"[REGISTER] Final result: {result_msg}")

    return {
        "detail": result_msg,
        "errors": errors
    }

@router.get("/me", response_model=StudentSchema)
def get_my_profile(db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_student)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found. Contact Admin to link your account.")
    return student

@router.get("/my-attendance")
def get_my_attendance(db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_student)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")
        
    from app.models.attendance import AttendanceLog
    from app.models.class_session import ClassSession
    from app.models.subject import Subject
    
    logs = db.query(AttendanceLog).join(ClassSession).join(Subject).filter(
        AttendanceLog.student_id == student.id
    ).order_by(AttendanceLog.timestamp.desc()).all()
    
    return [
        {
            "id": log.id,
            "subject": log.session.subject.name,
            "subject_code": log.session.subject.code if hasattr(log.session.subject, 'code') else "",
            "session_date": log.session.date,
            "status": log.status,
            "timestamp": log.timestamp,
            "confidence": log.confidence if hasattr(log, 'confidence') else None,
        } for log in logs
    ]

@router.get("/my-dashboard")
def get_my_dashboard(db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_student)):
    from app.models.attendance import AttendanceLog, AttendanceStatus
    from app.models.class_session import ClassSession, SessionStatus
    from app.models.subject import Subject
    from datetime import date, timedelta, datetime

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    embedding_count = db.query(FaceEmbedding).filter(FaceEmbedding.student_id == student.id).count()
    face_image_url = f"/uploads/students/{student.id}.jpg" if embedding_count > 0 else None

    logs = db.query(AttendanceLog).join(ClassSession).join(Subject).filter(
        AttendanceLog.student_id == student.id
    ).order_by(AttendanceLog.timestamp.asc()).all()

    present = [l for l in logs if str(l.status).upper().endswith("PRESENT")]
    absent  = [l for l in logs if str(l.status).upper().endswith("ABSENT")]
    total   = len(logs)
    att_pct = round(len(present) / total * 100, 1) if total > 0 else 0.0

    streak = 0
    for log in reversed(logs):
        if str(log.status).upper().endswith("PRESENT"):
            streak += 1
        else:
            break

    today = date.today()
    today_sessions = db.query(ClassSession).join(Subject).filter(
        ClassSession.date == today
    ).all()
    today_classes = [
        {
            "subject": s.subject.name if s.subject else "",
            "code": s.subject.code if s.subject and hasattr(s.subject, 'code') else "",
            "status": s.status.value if s.status else "SCHEDULED",
            "time": s.date.strftime("%H:%M") if isinstance(s.date, datetime) else str(s.date),
        } for s in today_sessions
    ]

    subjects_map = {}
    for log in logs:
        subj = log.session.subject
        if not subj:
            continue
        sid = subj.id
        if sid not in subjects_map:
            subjects_map[sid] = {"name": subj.name, "code": getattr(subj, 'code', ''), "present": 0, "total": 0}
        subjects_map[sid]["total"] += 1
        if str(log.status).upper().endswith("PRESENT"):
            subjects_map[sid]["present"] += 1
    per_subject = []
    for sid, v in subjects_map.items():
        pct = round(v["present"] / v["total"] * 100, 1) if v["total"] > 0 else 0.0
        per_subject.append({"subject": v["name"], "code": v["code"], "pct": pct, "present": v["present"], "total": v["total"]})

    weekly = []
    for w in range(7, -1, -1):
        week_start = today - timedelta(days=today.weekday() + w * 7)
        week_end   = week_start + timedelta(days=6)
        week_logs  = [l for l in logs if week_start <= l.session.date <= week_end]
        week_present = sum(1 for l in week_logs if str(l.status).upper().endswith("PRESENT"))
        week_pct = round(week_present / len(week_logs) * 100, 1) if week_logs else 0.0
        weekly.append({"week": week_start.strftime("%b %d"), "pct": week_pct, "present": week_present, "total": len(week_logs)})

    target = 75.0
    classes_needed = 0
    if att_pct < target:
        classes_needed = max(0, round((target / 100 * total - len(present)) / (1 - target / 100)))

    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "roll_number": student.roll_number,
            "department": student.department,
            "face_registered": embedding_count > 0,
            "face_image_url": face_image_url,
        },
        "stats": {
            "attendance_pct": att_pct,
            "total_classes": total,
            "attended": len(present),
            "missed": len(absent),
            "streak": streak,
        },
        "today_classes": today_classes,
        "per_subject": per_subject,
        "weekly_trend": weekly,
        "prediction": {
            "target_pct": target,
            "classes_needed": classes_needed,
            "current_pct": att_pct,
        },
    }

@router.get("/my-subjects")
def get_my_subjects(db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_student)):
    from app.models.attendance import AttendanceLog, AttendanceStatus
    from app.models.class_session import ClassSession
    from app.models.subject import Subject
    from app.models.user import User

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    logs = db.query(AttendanceLog).join(ClassSession).join(Subject).filter(
        AttendanceLog.student_id == student.id
    ).all()

    subjects_map = {}
    for log in logs:
        subj = log.session.subject
        if not subj:
            continue
        sid = subj.id
        if sid not in subjects_map:
            teacher = db.query(User).filter(User.id == subj.teacher_id).first() if subj.teacher_id else None
            subjects_map[sid] = {
                "id": sid,
                "name": subj.name,
                "code": getattr(subj, 'code', ''),
                "department": getattr(subj, 'department', ''),
                "semester": getattr(subj, 'semester', ''),
                "teacher": teacher.username if teacher else "—",
                "present": 0,
                "total": 0,
            }
        subjects_map[sid]["total"] += 1
        if str(log.status).upper().endswith("PRESENT"):
            subjects_map[sid]["present"] += 1

    result = []
    for v in subjects_map.values():
        pct = round(v["present"] / v["total"] * 100, 1) if v["total"] > 0 else 0.0
        result.append({**v, "attendance_pct": pct})
    return result

@router.get("/my-calendar")
def get_my_calendar(db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_student)):
    from app.models.attendance import AttendanceLog
    from app.models.class_session import ClassSession
    from app.models.subject import Subject

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    logs = db.query(AttendanceLog).join(ClassSession).join(Subject).filter(
        AttendanceLog.student_id == student.id
    ).all()

    calendar = {}
    for log in logs:
        date_str = str(log.session.date)
        if date_str not in calendar:
            calendar[date_str] = {"date": date_str, "present": 0, "absent": 0, "total": 0, "sessions": []}
        calendar[date_str]["total"] += 1
        if str(log.status).upper().endswith("PRESENT"):
            calendar[date_str]["present"] += 1
        else:
            calendar[date_str]["absent"] += 1
        calendar[date_str]["sessions"].append({
            "subject": log.session.subject.name if log.session.subject else "",
            "status": str(log.status),
        })

    result = []
    for d, v in calendar.items():
        if v["present"] == v["total"]:
            v["day_status"] = "present"
        elif v["absent"] == v["total"]:
            v["day_status"] = "absent"
        else:
            v["day_status"] = "partial"
        result.append(v)
    return sorted(result, key=lambda x: x["date"])

@router.get("/my-face")
def get_my_face(db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_student)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    embedding_count = db.query(FaceEmbedding).filter(FaceEmbedding.student_id == student.id).count()
    face_image_url = f"/uploads/students/{student.id}.jpg" if embedding_count > 0 else None
    return {
        "student_id": student.id,
        "name": student.name,
        "face_registered": embedding_count > 0,
        "embedding_count": embedding_count,
        "face_image_url": face_image_url,
    }
