import face_recognition
import numpy as np
from scipy.spatial import distance as dist

def eye_aspect_ratio(eye):
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    
    C = dist.euclidean(eye[0], eye[3])
    
    if C == 0:
        return 0.0
    ear = (A + B) / (2.0 * C)
    return ear

def check_liveness(image_array: np.ndarray, face_location: tuple, ear_threshold: float = 0.25) -> bool:
    landmarks_list = face_recognition.face_landmarks(image_array, [face_location])
    
    if not landmarks_list:
        return False, 0.0
        
    landmarks = landmarks_list[0]
    
    if "left_eye" not in landmarks or "right_eye" not in landmarks:
        return False, 0.0
        
    left_eye = landmarks["left_eye"]
    right_eye = landmarks["right_eye"]
    
    leftEAR = eye_aspect_ratio(left_eye)
    rightEAR = eye_aspect_ratio(right_eye)
    
    ear = (leftEAR + rightEAR) / 2.0
    
    is_open = ear > ear_threshold
    
    return is_open, ear
