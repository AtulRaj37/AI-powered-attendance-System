import face_recognition
import numpy as np
from typing import List, Optional

def generate_embedding(image_array: np.ndarray, face_location: tuple) -> Optional[np.ndarray]:
    encodings = face_recognition.face_encodings(image_array, [face_location])
    if len(encodings) > 0:
        return encodings[0]
    return None

def generate_multiple_embeddings(image_array: np.ndarray, face_locations: List[tuple]) -> List[np.ndarray]:
    return face_recognition.face_encodings(image_array, face_locations)
