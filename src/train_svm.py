
import numpy as np
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
import pickle
import os

def train_model():
    X = np.load('models/encodings.npy', allow_pickle=True)
    y = np.load('models/labels.npy', allow_pickle=True)

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    model = SVC(kernel='linear', probability=True)
    model.fit(X.tolist(), y_encoded)

    with open('models/svm_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    with open('models/label_encoder.pkl', 'wb') as f:
        pickle.dump(label_encoder, f)

    print("SVM model trained and saved.")

if __name__ == "__main__":
    train_model()
