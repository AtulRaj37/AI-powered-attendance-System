import cv2
import os

def capture_images(username, num_samples=50, save_dir="dataset"):
    user_dir = os.path.join(save_dir, username)
    os.makedirs(user_dir, exist_ok=True)

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

    cap = cv2.VideoCapture(0)
    count = 0

    print(f"[INFO] Starting capture for {username}. Look at the camera...")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

        for (x, y, w, h) in faces:
            count += 1
            face = frame[y:y+h, x:x+w]
            face = cv2.resize(face, (200, 200))

            file_path = os.path.join(user_dir, f"{username}_{count}.jpg")
            cv2.imwrite(file_path, face)

            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, f"Images: {count}/{num_samples}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        cv2.imshow("Capturing Images", frame)

        if count >= num_samples:
            print(f"[INFO] Successfully captured {num_samples} images for {username}")
            break

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    user_name = input("Enter the username: ")
    capture_images(user_name, num_samples=50)
