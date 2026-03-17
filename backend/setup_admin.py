import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.api.endpoints.auth import create_initial_admin
from app.db.session import SessionLocal

def run_setup():
    db = SessionLocal()
    try:
        result = create_initial_admin(db)
        print("Setup result:", result)
    except Exception as e:
        print(f"Error during setup: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_setup()
