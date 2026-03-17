
import cv2
import face_recognition
import numpy as np
import pickle
from attendance_log import mark_attendance

def load_models():
    with open('models/svm_model.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('models/label_encoder.pkl', 'rb') as f:
        le = pickle.load(f)
    return model, le

def recognize():
    model, label_encoder = load_models()

    video = cv2.VideoCapture(0)

    while True:
        ret, frame = video.read()
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        face_locations = face_recognition.face_locations(rgb)
        face_encodings = face_recognition.face_encodings(rgb, face_locations)

        for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
            probabilities = model.predict_proba([face_encoding])[0]
            best_idx = np.argmax(probabilities)
            name = label_encoder.inverse_transform([best_idx])[0]
            confidence = probabilities[best_idx]

            if confidence > 0.8:
                mark_attendance(name)
            else:
                name = "Unknown"

            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
            cv2.putText(frame, f"{name} ({confidence:.2f})", (left, top - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        cv2.imshow("Attendance System", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    video.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    recognize()
