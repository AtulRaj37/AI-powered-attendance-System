import face_recognition
import numpy as np

def detect_faces(image_array: np.ndarray):
    locations = face_recognition.face_locations(image_array, number_of_times_to_upsample=2)
    if locations:
        return locations
    for angle in [90, 180, 270]:
        rotated = np.rot90(image_array, k=angle // 90)
        locations = face_recognition.face_locations(rotated, number_of_times_to_upsample=2)
        if locations:
            return locations
    return []
