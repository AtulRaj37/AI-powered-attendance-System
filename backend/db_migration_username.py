import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "atulraj")
DB_HOST = os.getenv("POSTGRES_SERVER", "localhost")
DB_NAME = os.getenv("POSTGRES_DB", "attendance_db")

def run_migration():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Add username column
        print("Adding username column to users table...")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR UNIQUE;")
        
        # Add name column if it doesn't exist (since user asked for both name and username)
        print("Adding name column to users table...")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR;")
        
        print("Migration successful.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
