import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.face_embedding import FaceEmbedding
from app.models.student import Student

def find_best_match(db: Session, query_embedding: np.ndarray, threshold: float = 0.6):
    embedding_list = query_embedding.tolist()
    
    stmt = select(
        Student, 
        FaceEmbedding.embedding_vector.l2_distance(embedding_list).label("distance")
    ).join(
        FaceEmbedding, Student.id == FaceEmbedding.student_id
    ).order_by("distance").limit(1)
    
    result = db.execute(stmt).first()
    
    if result:
        student, dist = result
        if dist <= threshold:
            confidence = max(0.0, 1.0 - (dist / threshold))
            return {
                "match": True,
                "student": student,
                "distance": dist,
                "confidence": confidence
            }
        else:
            return {
                "match": False,
                "distance": dist
            }
            
    return {"match": False}
