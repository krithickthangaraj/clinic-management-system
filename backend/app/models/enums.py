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


class GenderEnum(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHERS = "Others"


class AgeFormat(str, Enum):
    YEARS = "Years"
    MONTHS = "Months"
    DAYS = "Days"


class GuardianRelation(str, Enum):
    SO = "S/o"
    DO = "D/o"
    WO = "W/o"
    BO = "B/o"
    CO = "C/o"


class ConsultantEnum(str, Enum):
    DR_JEYAGOWTHAMAN = "Dr. T.S.Jeyagowthaman"
    DR_TAMIL_INIYAN = "Dr. Tamil Iniyan"
    DR_ANURADHA = "Dr. Anuradha"
    DR_SHANMUGARANMAN = "Dr. A.K.K.Shanmugaranman"
    STAFF_NURSE = "Staff nurse"


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

