"""
One-time migration: Add 'department' and 'semester' columns to the subjects table.
Run with: python migrate_subjects.py
"""
import psycopg2

DB_CONFIG = {
    "host": "localhost",
    "database": "attendance_db",
    "user": "postgres",
    "password": "atulraj",
}

def migrate():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cur = conn.cursor()

    try:
        cur.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS department VARCHAR;")
        print("[OK] 'department' column added (or already exists).")
    except Exception as e:
        print(f"[ERROR] department: {e}")

    try:
        cur.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS semester VARCHAR;")
        print("[OK] 'semester' column added (or already exists).")
    except Exception as e:
        print(f"[ERROR] semester: {e}")

    cur.close()
    conn.close()
    print("\nMigration complete. You can now restart the server.")

if __name__ == "__main__":
    migrate()
