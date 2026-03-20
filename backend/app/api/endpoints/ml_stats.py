"""
ML Stats & Metrics API Endpoint
Exposes information about all ML models in the system,
accuracy metrics, and model health status.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.db.session import get_db
from app.api import deps
from app.ml.face_detection import get_detection_info
from app.ml.face_embedding import get_embedding_info
from app.ml.anti_spoofing import get_anti_spoofing_info
from app.ml.attendance_predictor import get_prediction_info
from app.ml.face_quality import get_quality_info
from app.ml.face_matcher import get_matcher_info

router = APIRouter()


@router.get("/models")
def get_ml_models():
    """List all ML models used in the system with their details."""
    models = [
        get_detection_info(),
        get_embedding_info(),
        get_anti_spoofing_info(),
        get_prediction_info(),
        get_quality_info(),
        get_matcher_info(),
    ]
    return {
        "total_models": len(models),
        "models": models,
    }


@router.get("/metrics")
def get_ml_metrics(
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_teacher)
):
    """Get ML pipeline accuracy metrics computed from real usage data."""
    from app.models.attendance import AttendanceLog
    from app.models.unknown_face import UnknownFace
    from app.models.face_embedding import FaceEmbedding
    from app.models.student import Student

    cutoff_24h = datetime.utcnow() - timedelta(hours=24)
    cutoff_7d = datetime.utcnow() - timedelta(days=7)

    # Detection stats
    total_recognitions = db.query(AttendanceLog).filter(
        AttendanceLog.timestamp >= cutoff_7d
    ).count()
    unknown_faces = db.query(UnknownFace).filter(
        UnknownFace.detected_at >= cutoff_7d
    ).count()
    total_attempts = total_recognitions + unknown_faces

    # Recognition accuracy
    if total_attempts > 0:
        recognition_accuracy = round(total_recognitions / total_attempts * 100, 1)
    else:
        recognition_accuracy = 0.0

    # Average confidence
    avg_confidence_row = db.query(func.avg(AttendanceLog.confidence)).filter(
        AttendanceLog.timestamp >= cutoff_7d,
        AttendanceLog.confidence.isnot(None)
    ).scalar()
    avg_confidence = round(float(avg_confidence_row) * 100, 1) if avg_confidence_row else 0.0

    # High confidence matches (>80%)
    high_conf_count = db.query(AttendanceLog).filter(
        AttendanceLog.timestamp >= cutoff_7d,
        AttendanceLog.confidence >= 0.8
    ).count()
    high_conf_rate = round(high_conf_count / max(1, total_recognitions) * 100, 1)

    # Enrollment stats
    total_students = db.query(Student).count()
    enrolled_students = db.query(
        func.count(func.distinct(FaceEmbedding.student_id))
    ).scalar() or 0
    total_embeddings = db.query(FaceEmbedding).count()

    return {
        "period": "last_7_days",
        "detection": {
            "model": "CNN + HOG Ensemble",
            "total_attempts": total_attempts,
            "faces_detected": total_recognitions,
            "unknown_faces": unknown_faces,
            "detection_rate": round(total_recognitions / max(1, total_attempts) * 100, 1),
        },
        "recognition": {
            "model": "ResNet-34 + KNN",
            "accuracy": recognition_accuracy,
            "avg_confidence": avg_confidence,
            "high_confidence_rate": high_conf_rate,
            "high_confidence_count": high_conf_count,
        },
        "anti_spoofing": {
            "model": "LBP + SVM",
            "expected_accuracy": "82-88%",
            "status": "active",
        },
        "attendance_prediction": {
            "model": "Logistic Regression",
            "expected_accuracy": "80-85%",
            "features_count": 12,
            "status": "active",
        },
        "face_quality": {
            "model": "Multi-metric Analysis",
            "minimum_threshold": "40%",
            "status": "active",
        },
        "enrollment": {
            "total_students": total_students,
            "enrolled_with_face": enrolled_students,
            "total_embeddings": total_embeddings,
            "avg_embeddings_per_student": round(total_embeddings / max(1, enrolled_students), 1),
        },
    }


@router.get("/pipeline")
def get_pipeline_info():
    """Show the full ML recognition pipeline and its stages."""
    return {
        "pipeline_name": "AI Attendance Recognition Pipeline",
        "stages": [
            {
                "order": 1,
                "name": "Image Preprocessing",
                "description": "CLAHE brightness normalization, Gaussian noise reduction, auto-resize",
                "model": None,
            },
            {
                "order": 2,
                "name": "Face Detection",
                "description": "Detect faces using CNN detector with HOG fallback",
                "model": "dlib CNN + HOG",
            },
            {
                "order": 3,
                "name": "Face Quality Assessment",
                "description": "Check blur, brightness, contrast, face size, symmetry",
                "model": "Laplacian + Histogram Analysis",
            },
            {
                "order": 4,
                "name": "Anti-Spoofing Check",
                "description": "Verify face is real (not photo/screen) using texture analysis",
                "model": "LBP + SVM Classifier",
            },
            {
                "order": 5,
                "name": "Face Embedding",
                "description": "Generate 128D face encoding using deep learning",
                "model": "dlib ResNet-34",
            },
            {
                "order": 6,
                "name": "Face Matching",
                "description": "Match against enrolled students using KNN classifier",
                "model": "scikit-learn KNN",
            },
            {
                "order": 7,
                "name": "Attendance Logging",
                "description": "Record attendance with confidence score and timestamp",
                "model": None,
            },
        ],
        "total_ml_models": 5,
        "total_pipeline_stages": 7,
    }
