from pydantic import BaseModel

class SubjectBase(BaseModel):
    name: str
    code: str

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: int
    teacher_id: int

    class Config:
        from_attributes = True
