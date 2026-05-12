from enum import Enum


class UserRole(str, Enum):
    RECEPTION = "reception"
    DOCTOR = "doctor"
    LAB = "lab"
    ADMIN = "admin"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class VisitStatus(str, Enum):
    REGISTERED = "registered"  # Just registered, waiting for vitals
    VITALS_DONE = "vitals_done"  # Vitals entered, waiting for doctor
    IN_CONSULTATION = "in_consultation"  # Doctor is seeing
    CONSULTED = "consulted"  # Consultation complete
    COMPLETED = "completed"  # Prescription printed, visit complete


class TestStatus(str, Enum):
    ORDERED = "ordered"  # Doctor ordered
    IN_PROGRESS = "in_progress"  # Lab working on it
    COMPLETED = "completed"  # Results entered
