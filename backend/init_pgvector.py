import sys
import os
from sqlalchemy import text
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal

def init_extension():
    db = SessionLocal()
    try:
        db.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        db.commit()
        print("pgvector extension initialized successfully on attendance_db.")
    except Exception as e:
        print(f"Error initializing extension: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_extension()
