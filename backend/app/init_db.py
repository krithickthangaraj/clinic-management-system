"""
Initialize database with default admin user.
Run this after creating the database and running migrations.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.enums import UserRole

def init_db():
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print("Admin user already exists")
            return

        # Create default admin user
        admin_user = User(
            username="admin",
            email="admin@clinic.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Administrator",
            role=UserRole.ADMIN.value,
            is_active=True
        )
        db.add(admin_user)

        # Create default doctor
        doctor_user = User(
            username="doctor",
            email="doctor@clinic.com",
            hashed_password=get_password_hash("doctor123"),
            full_name="Dr. John Doe",
            role=UserRole.DOCTOR.value,
            is_active=True
        )
        db.add(doctor_user)

        # Create default reception user
        reception_user = User(
            username="reception",
            email="reception@clinic.com",
            hashed_password=get_password_hash("reception123"),
            full_name="Reception Staff",
            role=UserRole.RECEPTION.value,
            is_active=True
        )
        db.add(reception_user)

        db.commit()
        print("Default users created successfully!")
        print("\nDefault credentials:")
        print("Admin: admin / admin123")
        print("Doctor: doctor / doctor123")
        print("Reception: reception / reception123")
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
