
import face_recognition
import os
import numpy as np
import pickle

def encode_faces(dataset_path='dataset'):
    known_encodings = []
    known_labels = []

    for user_name in os.listdir(dataset_path):
        user_dir = os.path.join(dataset_path, user_name)
        if not os.path.isdir(user_dir):
            continue

        for filename in os.listdir(user_dir):
            filepath = os.path.join(user_dir, filename)
            image = face_recognition.load_image_file(filepath)
            face_locations = face_recognition.face_locations(image)
            encodings = face_recognition.face_encodings(image, face_locations)

            if encodings:
                known_encodings.append(encodings[0])
                known_labels.append(user_name)

    np.save('models/encodings.npy', known_encodings)
    np.save('models/labels.npy', known_labels)

if __name__ == "__main__":
    encode_faces()
