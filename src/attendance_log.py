
import csv
from datetime import datetime

def mark_attendance(name):
    with open('attendance.csv', 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([name, datetime.now()])
    print(f"[INFO] Attendance marked for {name}")
