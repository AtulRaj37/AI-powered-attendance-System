import traceback
import sys

print("Attempting to import face_recognition...")
try:
    import face_recognition
    print("SUCCESS: face_recognition imported.")
except BaseException as e:
    print(f"FAILED: {e}")
    traceback.print_exc()
