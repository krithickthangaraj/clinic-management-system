import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.lab import LabTestMaster

LAB_TESTS_SEEDS = [
    {
        "test_name": "Complete Blood Count (CBC)",
        "category": "Hematology",
        "normal_range": "Normal Profile",
        "unit": "Profile",
        "price": 350.00,
    },
    {
        "test_name": "Hemoglobin (Hb)",
        "category": "Hematology",
        "normal_range": "13.0 - 17.0",
        "unit": "g/dL",
        "price": 120.00,
    },
    {
        "test_name": "Total WBC Count (TC)",
        "category": "Hematology",
        "normal_range": "4000 - 11000",
        "unit": "cells/cu.mm",
        "price": 150.00,
    },
    {
        "test_name": "Platelet Count",
        "category": "Hematology",
        "normal_range": "150000 - 450000",
        "unit": "cells/cu.mm",
        "price": 180.00,
    },
    {
        "test_name": "Erythrocyte Sedimentation Rate (ESR)",
        "category": "Hematology",
        "normal_range": "0 - 20",
        "unit": "mm/hr",
        "price": 100.00,
    },
    {
        "test_name": "Fasting Blood Sugar (FBS)",
        "category": "Biochemistry",
        "normal_range": "70 - 100",
        "unit": "mg/dL",
        "price": 100.00,
    },
    {
        "test_name": "Post Prandial Blood Sugar (PPBS)",
        "category": "Biochemistry",
        "normal_range": "70 - 140",
        "unit": "mg/dL",
        "price": 100.00,
    },
    {
        "test_name": "Random Blood Sugar (RBS)",
        "category": "Biochemistry",
        "normal_range": "70 - 140",
        "unit": "mg/dL",
        "price": 90.00,
    },
    {
        "test_name": "HbA1c (Glycated Hemoglobin)",
        "category": "Biochemistry",
        "normal_range": "< 5.7",
        "unit": "%",
        "price": 450.00,
    },
    {
        "test_name": "Serum Creatinine",
        "category": "Biochemistry",
        "normal_range": "0.6 - 1.2",
        "unit": "mg/dL",
        "price": 180.00,
    },
    {
        "test_name": "Blood Urea Nitrogen (BUN)",
        "category": "Biochemistry",
        "normal_range": "7 - 20",
        "unit": "mg/dL",
        "price": 160.00,
    },
    {
        "test_name": "Serum Uric Acid",
        "category": "Biochemistry",
        "normal_range": "3.5 - 7.2",
        "unit": "mg/dL",
        "price": 190.00,
    },
    {
        "test_name": "Lipid Profile (Complete)",
        "category": "Biochemistry",
        "normal_range": "Desirable Profile",
        "unit": "Profile",
        "price": 650.00,
    },
    {
        "test_name": "Serum Total Cholesterol",
        "category": "Biochemistry",
        "normal_range": "< 200",
        "unit": "mg/dL",
        "price": 180.00,
    },
    {
        "test_name": "Serum Triglycerides",
        "category": "Biochemistry",
        "normal_range": "< 150",
        "unit": "mg/dL",
        "price": 190.00,
    },
    {
        "test_name": "Liver Function Test (LFT)",
        "category": "Biochemistry",
        "normal_range": "Normal Range",
        "unit": "Profile",
        "price": 700.00,
    },
    {
        "test_name": "Serum Bilirubin (Total)",
        "category": "Biochemistry",
        "normal_range": "0.2 - 1.2",
        "unit": "mg/dL",
        "price": 150.00,
    },
    {
        "test_name": "Thyroid Stimulating Hormone (TSH)",
        "category": "Serology",
        "normal_range": "0.4 - 4.5",
        "unit": "µIU/mL",
        "price": 350.00,
    },
    {
        "test_name": "Urine Routine & Microscopic (CUE)",
        "category": "Clinical Pathology",
        "normal_range": "Clear / Nil / Normal",
        "unit": "Routine",
        "price": 150.00,
    },
    {
        "test_name": "Widal Test (Slide Agglutination)",
        "category": "Serology",
        "normal_range": "Negative / < 1:80",
        "unit": "Titre",
        "price": 220.00,
    },
]


def seed_lab_master():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        inserted = 0
        updated = 0
        for item_data in LAB_TESTS_SEEDS:
            existing = db.query(LabTestMaster).filter_by(test_name=item_data["test_name"]).first()
            if existing:
                existing.category = item_data["category"]
                existing.normal_range = item_data["normal_range"]
                existing.unit = item_data["unit"]
                existing.price = item_data["price"]
                existing.is_active = True
                updated += 1
            else:
                new_item = LabTestMaster(
                    test_name=item_data["test_name"],
                    category=item_data["category"],
                    normal_range=item_data["normal_range"],
                    unit=item_data["unit"],
                    price=item_data["price"],
                    is_active=True,
                )
                db.add(new_item)
                inserted += 1

        db.commit()
        total = db.query(LabTestMaster).count()
        print(f"✅ Successfully seeded Lab Test Master! Inserted: {inserted}, Updated: {updated}, Total Records: {total}")
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding Lab Test Master: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_lab_master()
