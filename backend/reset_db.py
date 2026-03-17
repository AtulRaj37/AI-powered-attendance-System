import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from app.models.base import Base
from app.models import user, student, subject, class_session, attendance, face_embedding, unknown_face

def reset():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Dropped safely.")

if __name__ == "__main__":
    reset()
