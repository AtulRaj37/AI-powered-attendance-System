import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.api.deps import get_db, get_current_active_admin
from app.models.base import Base
from app.models.user import User

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

def override_get_current_admin():
    return User(id=1, email="test@example.com", role="admin")

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_active_admin] = override_get_current_admin

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_read_main():
    response = client.get("/api/v1/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to AI Powered Attendance System API"}

def test_create_and_read_student():
    response = client.post(
        "/api/v1/students/",
        json={"name": "Alice M", "roll_number": "CS101", "department": "Computer Science"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Alice M"
    assert data["roll_number"] == "CS101"
    
    res_get = client.get("/api/v1/students/")
    assert res_get.status_code == 200
    assert len(res_get.json()) >= 1
    
def test_recognition_endpoint_mocked(mocker):
    mocker.patch('app.api.endpoints.attendance.detect_faces', return_value=[(0, 100, 100, 0)])
    mocker.patch('app.api.endpoints.attendance.check_liveness', return_value=(True, 0.3))
    mocker.patch('app.api.endpoints.attendance.generate_embedding', return_value=[0.1]*128)
    
    class MockStudent:
        id = 1
        name = "Bob"
        roll_number = "ME102"
        
    mocker.patch('app.api.endpoints.attendance.find_best_match', return_value={
        "match": True,
        "student": MockStudent(),
        "distance": 0.4,
        "confidence": 0.95
    })
    
    file_payload = b"dummy_image_content"
    
    response = client.post(
        "/api/v1/attendance/recognize",
        files={"file": ("test.jpg", file_payload, "image/jpeg")},
        data={"camera_id": "test_cam_01"}
    )
    
    assert response.status_code == 200
    res_data = response.json()
    assert len(res_data) == 1
    assert res_data[0]["name"] == "Bob"
    assert res_data[0]["confidence"] == 0.95
