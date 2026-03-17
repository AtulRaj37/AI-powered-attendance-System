from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector

revision: str = 'c356c310fb8b'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('unknown_faces',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('image_path', sa.String(), nullable=False),
    sa.Column('detected_at', sa.DateTime(), nullable=False),
    sa.Column('camera_id', sa.String(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_unknown_faces_id'), 'unknown_faces', ['id'], unique=False)
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('password_hash', sa.String(), nullable=False),
    sa.Column('role', sa.Enum('ADMIN', 'TEACHER', 'STUDENT', name='userrole'), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_table('students',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('roll_number', sa.String(), nullable=False),
    sa.Column('department', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_students_id'), 'students', ['id'], unique=False)
    op.create_index(op.f('ix_students_name'), 'students', ['name'], unique=False)
    op.create_index(op.f('ix_students_roll_number'), 'students', ['roll_number'], unique=True)
    op.create_table('subjects',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('code', sa.String(), nullable=False),
    sa.Column('teacher_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subjects_code'), 'subjects', ['code'], unique=True)
    op.create_index(op.f('ix_subjects_id'), 'subjects', ['id'], unique=False)
    op.create_index(op.f('ix_subjects_name'), 'subjects', ['name'], unique=False)
    op.create_table('class_sessions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('subject_id', sa.Integer(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('start_time', sa.Time(), nullable=False),
    sa.Column('end_time', sa.Time(), nullable=True),
    sa.Column('status', sa.Enum('SCHEDULED', 'ACTIVE', 'COMPLETED', name='sessionstatus'), nullable=False),
    sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_class_sessions_id'), 'class_sessions', ['id'], unique=False)
    op.create_table('face_embeddings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('embedding_vector', pgvector.sqlalchemy.vector.VECTOR(dim=128), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['student_id'], ['students.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_face_embeddings_id'), 'face_embeddings', ['id'], unique=False)
    op.create_table('attendance_logs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('session_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.Enum('PRESENT', 'ABSENT', 'LATE', name='attendancestatus'), nullable=False),
    sa.Column('confidence', sa.Float(), nullable=True),
    sa.Column('timestamp', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['session_id'], ['class_sessions.id'], ),
    sa.ForeignKeyConstraint(['student_id'], ['students.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attendance_logs_id'), 'attendance_logs', ['id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_attendance_logs_id'), table_name='attendance_logs')
    op.drop_table('attendance_logs')
    op.drop_index(op.f('ix_face_embeddings_id'), table_name='face_embeddings')
    op.drop_table('face_embeddings')
    op.drop_index(op.f('ix_class_sessions_id'), table_name='class_sessions')
    op.drop_table('class_sessions')
    op.drop_index(op.f('ix_subjects_name'), table_name='subjects')
    op.drop_index(op.f('ix_subjects_id'), table_name='subjects')
    op.drop_index(op.f('ix_subjects_code'), table_name='subjects')
    op.drop_table('subjects')
    op.drop_index(op.f('ix_students_roll_number'), table_name='students')
    op.drop_index(op.f('ix_students_name'), table_name='students')
    op.drop_index(op.f('ix_students_id'), table_name='students')
    op.drop_table('students')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_unknown_faces_id'), table_name='unknown_faces')
    op.drop_table('unknown_faces')
