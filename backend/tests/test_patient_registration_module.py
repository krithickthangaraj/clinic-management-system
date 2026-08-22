import unittest
from datetime import date
from pydantic import ValidationError
from app.schemas.patient import PatientCreate, PatientRegistrationPayload, PatientResponse
from app.schemas.vitals import VitalsCreate, VitalsResponse
from app.core.database import SessionLocal
from app.services.patient_service import generate_patient_id, register_patient_with_visit


class TestPatientRegistrationModule(unittest.TestCase):
    def test_demographics_validation(self):
        # Valid payload
        payload = {
            "full_name": "Test Patient",
            "phone_number": "9876543210",
            "dob": "1990-05-15",
            "age": 34,
            "age_format": "Years",
            "gender": "Male",
            "guardian_name": "Father Name",
            "guardian_relation": "S/o",
        }
        p = PatientCreate(**payload)
        self.assertEqual(p.name, "Test Patient")
        self.assertEqual(p.phone, "9876543210")
        self.assertEqual(p.gender, "Male")
        self.assertEqual(p.guardian_relation, "S/o")

        # Invalid phone (less than 10 digits)
        with self.assertRaises(ValidationError):
            PatientCreate(full_name="Invalid Phone", phone_number="987654321")

        # Invalid phone (more than 10 digits)
        with self.assertRaises(ValidationError):
            PatientCreate(full_name="Invalid Phone", phone_number="987654321000")

    def test_vitals_calculations_and_bounds(self):
        # Valid vitals with BMI auto-calc & temp conversion
        vitals_data = {
            "visit_id": 1,
            "weight_kg": 70.0,
            "height_cm": 175.0,
            "blood_pressure": "120/80",
            "temperature_f": 98.6,
            "spo2_percent": 99,
            "pulse_rate_bpm": 74,
            "grbs_mg_dl": 115,
            "consultant_assigned": "Dr. T.S.Jeyagowthaman",
            "remarks": "Test remarks",
        }
        v = VitalsCreate(**vitals_data)
        self.assertEqual(v.bmi, 22.9)  # 70 / (1.75^2) = 22.857 -> 22.9
        self.assertEqual(v.bp_systolic, 120)
        self.assertEqual(v.bp_diastolic, 80)
        self.assertEqual(v.temperature, 37.0)  # (98.6 - 32) * 5 / 9 = 37.0
        self.assertEqual(v.spo2, 99)
        self.assertEqual(v.pr, 74)
        self.assertEqual(v.sugar, 115.0)

        # Out of bounds weight (> 200)
        with self.assertRaises(ValidationError):
            VitalsCreate(visit_id=1, weight_kg=250)

        # Out of bounds height (> 250)
        with self.assertRaises(ValidationError):
            VitalsCreate(visit_id=1, height_cm=300)

        # Out of bounds SpO2 (> 100)
        with self.assertRaises(ValidationError):
            VitalsCreate(visit_id=1, spo2_percent=105)

    def test_patient_id_generation(self):
        db = SessionLocal()
        try:
            pat_id = generate_patient_id(db)
            self.assertTrue(pat_id.startswith("PAT-"))
            self.assertEqual(len(pat_id), 9)  # PAT-XXXXX
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
