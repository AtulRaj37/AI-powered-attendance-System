from typing import List
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func
from datetime import date, datetime
import os
import uuid
import io
from PIL import Image
import numpy as np
import cv2

from app.db.session import get_db
from app.api import deps
from app.core.websockets import manager
from app.models.attendance import AttendanceLog
from app.models.unknown_face import UnknownFace
from app.schemas.attendance import AttendanceInDBBase
from app.schemas.student import MatchResult
from app.ml.face_detection import detect_faces
from app.ml.face_embedding import generate_embedding
from app.ml.face_matcher import find_best_match
from app.ml.liveness_detector import check_liveness

router = APIRouter()

os.makedirs("uploads/unknowns", exist_ok=True)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

from app.models.class_session import ClassSession, SessionStatus
from app.models.attendance import AttendanceStatus

@router.post("/recognize/{session_id}", response_model=List[MatchResult])
async def recognize_face(
    session_id: int,
    file: UploadFile = File(...),
    camera_id: str = Form("default_cam"),
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    session = db.query(ClassSession).filter(
        ClassSession.id == session_id,
        ClassSession.status == SessionStatus.ACTIVE
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")

    contents = await file.read()
    image_stream = io.BytesIO(contents)
    
    try:
        img = Image.open(image_stream).convert('RGB')
        img_array = np.array(img)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    face_locations = detect_faces(img_array)
    print(f"[RECOGNIZE] Found {len(face_locations)} face(s) in frame for session {session_id}")
    results = []
    
    current_time = datetime.utcnow()

    for face_loc in face_locations:
        is_live, ear = check_liveness(img_array, face_loc, ear_threshold=0.15)
        print(f"[RECOGNIZE] Liveness check -> is_live={is_live}, EAR={ear:.3f}")
        
        if not is_live and ear > 0.0:
            print(f"[RECOGNIZE] Skipping face - eyes appear closed (EAR={ear:.3f})")
            continue
        
        embedding = generate_embedding(img_array, face_loc)
        if embedding is None:
            print(f"[RECOGNIZE] Failed to generate embedding for face at {face_loc}")
            continue
            
        match_data = find_best_match(db, embedding, threshold=0.75)
        print(f"[RECOGNIZE] Match result: match={match_data['match']}, dist={match_data.get('distance', 'N/A')}, name={match_data['student'].name if match_data.get('student') else 'None'}")
        
        if match_data["match"]:
            student = match_data["student"]
            confidence = match_data["confidence"]
            dist = match_data["distance"]
            print(f"[RECOGNIZE] ✅ MATCH: {student.name} (confidence={confidence:.2f}, dist={dist:.4f})")
            
            existing_log = db.query(AttendanceLog).filter(
                and_(
                    AttendanceLog.student_id == student.id,
                    AttendanceLog.session_id == session.id
                )
            ).first()
            
            if not existing_log:
                new_log = AttendanceLog(
                    student_id=student.id,
                    session_id=session.id,
                    status=AttendanceStatus.PRESENT,
                    confidence=confidence,
                    timestamp=current_time
                )
                db.add(new_log)
                db.commit()
                db.refresh(new_log)
                print(f"[RECOGNIZE] ✅ Attendance MARKED for {student.name}")
                
                await manager.broadcast({
                    "event": "attendance_marked",
                    "student_id": student.id,
                    "student_name": student.name,
                    "roll_number": student.roll_number,
                    "session_id": session.id,
                    "camera_id": camera_id,
                    "time": current_time.strftime("%H:%M:%S")
                })
            else:
                print(f"[RECOGNIZE] ⏭️ Already marked for {student.name} in this session")
            
            results.append(
                MatchResult(
                    student_id=student.id,
                    name=student.name,
                    roll_number=student.roll_number,
                    confidence=confidence,
                    distance=dist
                )
            )
        else:
            print(f"[RECOGNIZE] ❌ No match (best dist={match_data.get('distance', 'N/A')}) - saving as unknown")
            top, right, bottom, left = face_loc
            h, w, _ = img_array.shape
            pad = 20
            p_top = max(0, top - pad)
            p_bottom = min(h, bottom + pad)
            p_left = max(0, left - pad)
            p_right = min(w, right + pad)
            
            face_img = img_array[p_top:p_bottom, p_left:p_right]
            face_pil = Image.fromarray(face_img)
            filename = f"unknown_{uuid.uuid4().hex}.jpg"
            filepath = os.path.join("uploads/unknowns", filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            face_pil.save(filepath)
            
            new_unknown = UnknownFace(
                image_path=filepath,
                camera_id=camera_id
            )
            db.add(new_unknown)
            db.commit()
            
            await manager.broadcast({
                "event": "unknown_detected",
                "session_id": session.id,
                "camera_id": camera_id,
                "image_path": filepath
            })
            
            results.append(
                MatchResult(
                    student_id=None,
                    name="Unknown",
                    roll_number=None,
                    confidence=0.0,
                    distance=match_data.get("distance", 1.0)
                )
            )

    return results

@router.get("/today", response_model=List[dict])
def get_today_attendance(db: Session = Depends(get_db)):
    from app.models.student import Student
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(hours=24)
    rows = db.query(
        AttendanceLog.id,
        AttendanceLog.confidence,
        AttendanceLog.timestamp,
        Student.name.label('student_name'),
        Student.roll_number.label('roll_number')
    ).join(Student, AttendanceLog.student_id == Student.id).filter(
        AttendanceLog.timestamp >= cutoff
    ).order_by(AttendanceLog.timestamp.desc()).all()
    
    return [{
        "id": row.id,
        "student_name": row.student_name,
        "roll_number": row.roll_number,
        "time": row.timestamp.strftime("%H:%M:%S") if row.timestamp else "-",
        "camera_id": "webcam",
        "confidence": row.confidence
    } for row in rows]

@router.get("/report")
def get_attendance_report(db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    from sqlalchemy import cast, Date
    results = db.query(
        cast(AttendanceLog.timestamp, Date).label('date'), 
        func.count(AttendanceLog.id)
    ).group_by(
        cast(AttendanceLog.timestamp, Date)
    ).order_by(
        cast(AttendanceLog.timestamp, Date).desc()
    ).limit(30).all()
    
    report = [{"date": str(r[0]), "count": r[1]} for r in results]
    return report

@router.get("/unknown-faces")
def get_unknown_faces(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_admin)):
    faces = db.query(UnknownFace).order_by(UnknownFace.detected_at.desc()).offset(skip).limit(limit).all()
    return faces

@router.get("/unknown-faces/recent")
def get_recent_unknown_faces(db: Session = Depends(get_db), current_user = Depends(deps.get_current_active_teacher)):
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(hours=24)
    faces = db.query(UnknownFace).filter(
        UnknownFace.detected_at >= cutoff
    ).order_by(UnknownFace.detected_at.desc()).limit(20).all()
    return [{"id": f.id, "image_path": f.image_path, "camera_id": f.camera_id, "detected_at": str(f.detected_at)} for f in faces]

@router.put("/{log_id}/override")
def override_attendance(
    log_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher),
    status: str = "PRESENT"
):
    from pydantic import BaseModel
    log = db.query(AttendanceLog).filter(AttendanceLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Attendance log not found")
    try:
        log.status = AttendanceStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status '{status}'. Must be PRESENT, ABSENT, or LATE.")
    db.commit()
    return {"msg": f"Log {log_id} updated to {status}"}

@router.post("/override-manual")
def create_manual_attendance(
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher),
    student_id: int = None,
    session_id: int = None,
    status: str = "PRESENT"
):
    from sqlalchemy import and_
    existing = db.query(AttendanceLog).filter(
        AttendanceLog.student_id == student_id,
        AttendanceLog.session_id == session_id
    ).first()
    if existing:
        existing.status = AttendanceStatus(status)
    else:
        new_log = AttendanceLog(
            student_id=student_id,
            session_id=session_id,
            status=AttendanceStatus(status),
            confidence=1.0,
            timestamp=datetime.utcnow()
        )
        db.add(new_log)
    db.commit()
    return {"msg": "Attendance recorded manually"}

@router.post("/override")
async def override_attendance_post(
    body: dict,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    student_id = body.get("student_id")
    session_id = body.get("session_id")
    status_str = body.get("status", "PRESENT")

    try:
        new_status = AttendanceStatus(status_str)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status '{status_str}'")

    existing = db.query(AttendanceLog).filter(
        AttendanceLog.student_id == student_id,
        AttendanceLog.session_id == session_id
    ).first()
    if existing:
        existing.status = new_status
    else:
        new_log = AttendanceLog(
            student_id=student_id,
            session_id=session_id,
            status=new_status,
            confidence=1.0,
            timestamp=datetime.utcnow()
        )
        db.add(new_log)
    db.commit()

    await manager.broadcast({
        "event": "attendance_override",
        "student_id": student_id,
        "session_id": session_id,
        "status": status_str,
    })

    return {"msg": f"Attendance set to {status_str}"}

@router.get("/session/{session_id}/roster")
def get_session_roster(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    from app.models.student import Student
    from app.models.face_embedding import FaceEmbedding

    students = db.query(Student).all()
    roster = []
    for student in students:
        log = db.query(AttendanceLog).filter(
            AttendanceLog.student_id == student.id,
            AttendanceLog.session_id == session_id
        ).first()
        has_face = db.query(FaceEmbedding).filter(FaceEmbedding.student_id == student.id).first() is not None
        roster.append({
            "student_id": student.id,
            "name": student.name,
            "roll_number": student.roll_number,
            "department": student.department,
            "status": log.status if log else "ABSENT",
            "confidence": round(log.confidence * 100, 1) if log and log.confidence else None,
            "timestamp": log.timestamp.strftime("%H:%M:%S") if log and log.timestamp else None,
            "has_face_registered": has_face,
            "log_id": log.id if log else None,
        })
    return roster

@router.get("/ai-stats")
def get_ai_stats(
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    from datetime import timedelta
    from app.models.unknown_face import UnknownFace

    cutoff_24h = datetime.utcnow() - timedelta(hours=24)

    faces_detected = db.query(AttendanceLog).filter(
        AttendanceLog.timestamp >= cutoff_24h
    ).count()

    avg_conf_row = db.query(func.avg(AttendanceLog.confidence)).filter(
        AttendanceLog.timestamp >= cutoff_24h,
        AttendanceLog.confidence.isnot(None)
    ).scalar()
    avg_conf = round(float(avg_conf_row) * 100, 1) if avg_conf_row else 0

    unknown_count = db.query(UnknownFace).filter(
        UnknownFace.detected_at >= cutoff_24h
    ).count()

    return {
        "faces_detected_today": faces_detected,
        "avg_confidence": avg_conf,
        "unknown_faces_today": unknown_count,
        "recognition_rate": round(faces_detected / max(1, faces_detected + unknown_count) * 100, 1)
    }

@router.get("/student/{student_id}/history")
def get_student_attendance_history(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(deps.get_current_active_teacher)
):
    from app.models.class_session import ClassSession
    from app.models.subject import Subject

    logs = db.query(AttendanceLog).filter(
        AttendanceLog.student_id == student_id
    ).order_by(AttendanceLog.timestamp.desc()).all()

    result = []
    for log in logs:
        session = db.query(ClassSession).filter(ClassSession.id == log.session_id).first()
        subject = db.query(Subject).filter(Subject.id == session.subject_id).first() if session else None
        result.append({
            "log_id": log.id,
            "date": str(session.date) if session else "Unknown",
            "subject_name": subject.name if subject else "Unknown",
            "subject_code": subject.code if subject else "",
            "status": log.status,
            "confidence": round(log.confidence * 100, 1) if log.confidence else None,
            "timestamp": log.timestamp.strftime("%H:%M:%S") if log.timestamp else None,
        })
    return result
