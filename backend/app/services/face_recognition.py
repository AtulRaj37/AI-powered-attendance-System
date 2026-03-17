import face_recognition
import numpy as np
from typing import Optional, List
import io
from PIL import Image

def get_face_encoding(image_bytes: bytes) -> Optional[np.ndarray]:
    image_stream = io.BytesIO(image_bytes)
    img = Image.open(image_stream).convert('RGB')
    img_array = np.array(img)

    face_locations = face_recognition.face_locations(img_array)
    if len(face_locations) != 1:
        return None

    face_encodings = face_recognition.face_encodings(img_array, face_locations)
    if not face_encodings:
        return None

    return face_encodings[0]

def get_all_face_encodings(image_bytes: bytes) -> List[dict]:
    image_stream = io.BytesIO(image_bytes)
    img = Image.open(image_stream).convert('RGB')
    img_array = np.array(img)

    face_locations = face_recognition.face_locations(img_array)
    face_encodings = face_recognition.face_encodings(img_array, face_locations)

    results = []
    for loc, enc in zip(face_locations, face_encodings):
        results.append({
            "location": loc,
            "encoding": enc
        })
    return results
