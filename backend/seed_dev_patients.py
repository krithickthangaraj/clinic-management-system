#!/usr/bin/env python3
"""
1-Click Development Patient Generator (seed_dev_patients.py)
Instantly creates 5 realistic patients for today across all clinical pipeline stages:
1. Patient 1: REGISTERED (Waiting for vitals)
2. Patient 2: REGISTERED (Waiting for vitals)
3. Patient 3: VITALS_DONE (Waiting for Doctor Desk)
4. Patient 4: IN_CONSULTATION (Doctor currently consulting)
5. Patient 5: COMPLETED (Prescription done & ready for pharmacy)
"""

import os
import sys
from datetime import datetime, date, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.vitals import Vitals
from app.models.prescription import Prescription, PrescriptionDrug
from app.services.patient_service import generate_patient_id, generate_visit_number

DEV_PATIENTS_DATA = [
    {
        "name": "Aravind Swamy",
        "age": 42,
        "age_format": "Years",
        "gender": "Male",
        "phone": "9840112345",
        "guardian_name": "Rangarajan",
        "guardian_relation": "S/o",
        "address": "14 Gandhi Road, Salem",
        "status": VisitStatus.REGISTERED.value,
        "chief_complaints": "Fever and persistent dry cough for 2 days",
        "consultant": "Dr. T.S.Jeyagowthaman",
        "mins_ago": 12,
        "vitals": None,
    },
    {
        "name": "Deepa Natarajan",
        "age": 29,
        "age_format": "Years",
        "gender": "Female",
        "phone": "9840223456",
        "guardian_name": "Natarajan",
        "guardian_relation": "D/o",
        "address": "7 Bazaar Street, Erode",
        "status": VisitStatus.REGISTERED.value,
        "chief_complaints": "Severe throbbing headache and mild dizziness",
        "consultant": "Dr. T.S.Jeyagowthaman",
        "mins_ago": 25,
        "vitals": None,
    },
    {
        "name": "Karthik Subramanian",
        "age": 52,
        "age_format": "Years",
        "gender": "Male",
        "phone": "9840334567",
        "guardian_name": "Subramanian",
        "guardian_relation": "S/o",
        "address": "88 Cross Cut Road, Coimbatore",
        "status": VisitStatus.VITALS_DONE.value,
        "chief_complaints": "Routine hypertension checkup and mild fatigue",
        "consultant": "Dr. T.S.Jeyagowthaman",
        "mins_ago": 38,
        "vitals": {
            "weight": 74.0,
            "height": 172.0,
            "bmi": 25.0,
            "bp_systolic": 130,
            "bp_diastolic": 85,
            "temperature": 37.0,
            "spo2": 98,
            "pr": 76,
            "sugar": 124.0,
            "remarks": "Known hypertensive on regular medication",
        },
    },
    {
        "name": "Meenakshi Sundaram",
        "age": 64,
        "age_format": "Years",
        "gender": "Female",
        "phone": "9840445678",
        "guardian_name": "Sundaram",
        "guardian_relation": "W/o",
        "address": "22 Temple Street, Tiruppur",
        "status": VisitStatus.IN_CONSULTATION.value,
        "chief_complaints": "Type 2 Diabetes follow-up, burning sensation in feet",
        "consultant": "Dr. T.S.Jeyagowthaman",
        "mins_ago": 50,
        "vitals": {
            "weight": 62.0,
            "height": 158.0,
            "bmi": 24.8,
            "bp_systolic": 138,
            "bp_diastolic": 88,
            "temperature": 36.8,
            "spo2": 99,
            "pr": 80,
            "sugar": 168.0,
            "remarks": "Fasting blood sugar high today",
        },
    },
    {
        "name": "Senthil Kumar",
        "age": 35,
        "age_format": "Years",
        "gender": "Male",
        "phone": "9840556789",
        "guardian_name": "Muthusamy",
        "guardian_relation": "S/o",
        "address": "5 Anna Nagar, Namakkal",
        "status": VisitStatus.COMPLETED.value,
        "chief_complaints": "Severe epigastric burning pain, acid reflux after meals",
        "consultant": "Dr. T.S.Jeyagowthaman",
        "mins_ago": 75,
        "vitals": {
            "weight": 68.0,
            "height": 169.0,
            "bmi": 23.8,
            "bp_systolic": 120,
            "bp_diastolic": 80,
            "temperature": 37.0,
            "spo2": 99,
            "pr": 72,
            "sugar": 98.0,
            "remarks": "Vitals normal, abdomen soft",
        },
        "diagnosis": "Acute Gastroduodenitis",
        "advice": "Avoid spicy foods. Take medications before food regularly.",
        "medicines": [
            {
                "brand_name": "Panpro 40mg Tab.",
                "drug_name": "Pantoprazole",
                "dosage": "1 Tab",
                "frequency": "OD (1-0-0)",
                "number_of_days": 5,
                "instructions": "Before Food",
                "quantity": 5,
            },
            {
                "brand_name": "Gelucil Syr.",
                "drug_name": "Aluminium hydroxide",
                "dosage": "10ml",
                "frequency": "TDS (1-1-1)",
                "number_of_days": 3,
                "instructions": "After food",
                "quantity": 1,
            },
        ],
    },
]


def seed_dev_patients():
    db = SessionLocal()
    try:
        # 1. Ensure Doctor exists
        doctor = db.query(User).filter_by(role=UserRole.DOCTOR.value).first()
        if not doctor:
            doctor = User(
                username="dr_jeyagowthaman",
                hashed_password="pw",
                full_name="Dr. T.S.Jeyagowthaman",
                role=UserRole.DOCTOR.value,
            )
            db.add(doctor)
            db.commit()
            db.refresh(doctor)

        now = datetime.now()
        created_count = 0

        for p_data in DEV_PATIENTS_DATA:
            # Create Patient
            patient = Patient(
                patient_id=generate_patient_id(db),
                name=p_data["name"],
                age=p_data["age"],
                age_format=p_data["age_format"],
                age_years=p_data["age"],
                gender=p_data["gender"],
                phone=p_data["phone"],
                guardian_name=p_data["guardian_name"],
                guardian_relation=p_data["guardian_relation"],
                address=p_data["address"],
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)

            # Create Visit timestamped earlier today
            visit_time = now - timedelta(minutes=p_data["mins_ago"])
            visit = Visit(
                visit_number=generate_visit_number(db),
                patient_id=patient.id,
                doctor_id=doctor.id,
                status=p_data["status"],
                consultant_assigned=p_data["consultant"],
                chief_complaints=p_data["chief_complaints"],
                diagnosis=p_data.get("diagnosis"),
                advice=p_data.get("advice"),
                created_at=visit_time,
                updated_at=now if p_data["status"] == VisitStatus.COMPLETED.value else visit_time,
            )
            db.add(visit)
            db.commit()
            db.refresh(visit)

            # Add Vitals if present
            if p_data.get("vitals"):
                v_info = p_data["vitals"]
                vitals = Vitals(
                    visit_id=visit.id,
                    weight_kg=v_info["weight"],
                    height_cm=v_info["height"],
                    bmi=v_info["bmi"],
                    blood_pressure=f"{v_info['bp_systolic']}/{v_info['bp_diastolic']}",
                    bp_systolic=v_info["bp_systolic"],
                    bp_diastolic=v_info["bp_diastolic"],
                    temperature_f=round(v_info["temperature"] * 9 / 5 + 32, 1),
                    temperature=v_info["temperature"],
                    spo2_percent=v_info["spo2"],
                    spo2=v_info["spo2"],
                    pulse_rate_bpm=v_info["pr"],
                    pr=v_info["pr"],
                    grbs_mg_dl=int(v_info["sugar"]),
                    sugar=v_info["sugar"],
                    remarks=v_info["remarks"],
                    created_at=visit_time,
                )
                db.add(vitals)
                db.commit()

            # Add Prescription if completed
            if p_data.get("medicines"):
                prescription = Prescription(
                    visit_id=visit.id,
                    doctor_id=doctor.id,
                    created_at=visit_time,
                )
                db.add(prescription)
                db.commit()
                db.refresh(prescription)

                for idx, med in enumerate(p_data["medicines"], start=1):
                    start_d = date.today()
                    end_d = start_d + timedelta(days=med["number_of_days"])
                    p_drug = PrescriptionDrug(
                        prescription_id=prescription.id,
                        s_no=idx,
                        brand_name=med["brand_name"],
                        drug_name=med["drug_name"],
                        dosage=med["dosage"],
                        frequency=med["frequency"],
                        start_date=start_d,
                        number_of_days=med["number_of_days"],
                        end_date=end_d,
                        instructions=med["instructions"],
                        quantity=med["quantity"],
                    )
                    db.add(p_drug)
                db.commit()

            created_count += 1
            print(f"  ✓ Created Patient #{created_count}: {p_data['name']} ({p_data['status']}) - Token: {visit.visit_number}")

        print()
        print(f"🎉 Successfully seeded {created_count} active test patients for today!")
        print("Doctor Desk & Reception queues are now fully populated.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding dev patients: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_dev_patients()
