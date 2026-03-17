from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.student import Student
from app.schemas.token import Token
from app.schemas.user import UserCreate, User as UserSchema, UserUpdate

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = db.query(User).filter(or_(User.email == form_data.username, User.username == form_data.username)).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email, username, or password")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, role=user.role, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/setup")
def create_initial_admin(db: Session = Depends(deps.get_db)):
    user = db.query(User).filter(User.email == "admin@example.com").first()
    if user:
        return {"msg": "Admin already exists"}
    
    from app.models.user import UserRole
    user = User(
        email="admin@example.com",
        password_hash=security.get_password_hash("admin123"),
        role=UserRole.ADMIN
    )
    db.add(user)
    db.commit()
    return {"msg": "Admin created. Email: admin@example.com / Pass: admin123"}

@router.post("/signup", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def signup(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db)
) -> Any:
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    try:
        role_enum = UserRole[user_in.role.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid user role specified.")

    new_user = User(
        email=user_in.email,
        username=user_in.username,
        name=user_in.name,
        password_hash=security.get_password_hash(user_in.password),
        role=role_enum
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if role_enum == UserRole.STUDENT:
        if not user_in.name or not user_in.roll_number:
            db.delete(new_user)
            db.commit()
            raise HTTPException(status_code=400, detail="Students must provide a 'name' and 'roll_number'.")
            
        student_profile = Student(
            user_id=new_user.id,
            name=user_in.name,
            roll_number=user_in.roll_number,
            department=user_in.department
        )
        db.add(student_profile)
        db.commit()

    return new_user

@router.get("/profile", response_model=UserSchema)
def get_profile(current_user: User = Depends(deps.get_current_user)):
    return current_user

@router.put("/profile", response_model=UserSchema)
def update_profile(
    user_in: UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    if user_in.email is not None and user_in.email != current_user.email:
        existing_user = db.query(User).filter(User.email == user_in.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_in.email
        
    if user_in.username is not None and user_in.username != current_user.username:
        existing_user = db.query(User).filter(User.username == user_in.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = user_in.username
        
    if user_in.name is not None:
        current_user.name = user_in.name

    if user_in.password:
        current_user.password_hash = security.get_password_hash(user_in.password)

    db.commit()
    db.refresh(current_user)
    return current_user
