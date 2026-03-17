import face_recognition
import numpy as np

def detect_faces(image_array: np.ndarray):
    return face_recognition.face_locations(image_array)
