import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models.medicine import MedicineMaster

MEDICINE_MASTER_SEEDS = [
    # 1-7 Exact required items
    {
        "brand_name": "Zental 400mg Tab.",
        "drug_name": "Albendazole",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "STAT",
        "default_days": 1,
        "default_instructions": "To chew at bed time",
    },
    {
        "brand_name": "Gramocef 200mg Tab.",
        "drug_name": "Cefixime",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "TDS (1-1-1)",
        "default_days": 3,
        "default_instructions": "",
    },
    {
        "brand_name": "Panpro 40mg Tab.",
        "drug_name": "Pantoprazole",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "OD (1-0-0)",
        "default_days": 3,
        "default_instructions": "Before Food",
    },
    {
        "brand_name": "Gelucil Syr.",
        "drug_name": "Aluminium hydroxide",
        "category": "Syrup",
        "default_dosage": "10ml",
        "default_frequency": "QID (1-1-1-1)",
        "default_days": 3,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Alerlife-LS Syr.",
        "drug_name": "Ambroxol, Terbutaline",
        "category": "Syrup",
        "default_dosage": "7.5ml",
        "default_frequency": "TDS (1-1-1)",
        "default_days": 3,
        "default_instructions": "",
    },
    {
        "brand_name": "Dolo 650mg Tab.",
        "drug_name": "Paracetamol",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "SOS",
        "default_days": 4,
        "default_instructions": "Fever, Headache",
    },
    {
        "brand_name": "Alprax 0.5mg Tab.",
        "drug_name": "Alprazolam",
        "category": "Tablet",
        "default_dosage": "0.5 Tab",
        "default_frequency": "HS (0-0-1)",
        "default_days": 3,
        "default_instructions": "",
    },

    # 8-40 Additional standard clinical medications
    {
        "brand_name": "Augmentin 625 Duo Tab.",
        "drug_name": "Amoxicillin + Clavulanic Acid",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "BD (1-0-1)",
        "default_days": 5,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Calpol 500mg Tab.",
        "drug_name": "Paracetamol",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "TDS (1-1-1)",
        "default_days": 3,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Ascoril D Plus Syr.",
        "drug_name": "Dextromethorphan + Phenylephrine",
        "category": "Syrup",
        "default_dosage": "10ml",
        "default_frequency": "TDS (1-1-1)",
        "default_days": 4,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Montek LC Tab.",
        "drug_name": "Montelukast + Levocetirizine",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "HS (0-0-1)",
        "default_days": 5,
        "default_instructions": "Night after food",
    },
    {
        "brand_name": "Azithral 500mg Tab.",
        "drug_name": "Azithromycin",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "OD (1-0-0)",
        "default_days": 3,
        "default_instructions": "1 hr before food",
    },
    {
        "brand_name": "Telma 40mg Tab.",
        "drug_name": "Telmisartan",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "OD (1-0-0)",
        "default_days": 30,
        "default_instructions": "Morning with water",
    },
    {
        "brand_name": "Glycomet 500mg Tab.",
        "drug_name": "Metformin Hydrochloride",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "BD (1-0-1)",
        "default_days": 30,
        "default_instructions": "With meals",
    },
    {
        "brand_name": "Shelcal 500mg Tab.",
        "drug_name": "Calcium + Vitamin D3",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "OD (0-1-0)",
        "default_days": 30,
        "default_instructions": "After lunch",
    },
    {
        "brand_name": "Becosules Z Cap.",
        "drug_name": "Vitamin B-Complex + Zinc",
        "category": "Capsule",
        "default_dosage": "1 Cap",
        "default_frequency": "OD (0-1-0)",
        "default_days": 15,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Volini Gel",
        "drug_name": "Diclofenac Diethylamine",
        "category": "Ointment",
        "default_dosage": "Apply",
        "default_frequency": "TDS (1-1-1)",
        "default_days": 5,
        "default_instructions": "Gently massage on pain area",
    },
    {
        "brand_name": "Combiflam Tab.",
        "drug_name": "Ibuprofen + Paracetamol",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "BD (1-0-1)",
        "default_days": 3,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Cetzine 10mg Tab.",
        "drug_name": "Cetirizine Dihydrochloride",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "HS (0-0-1)",
        "default_days": 5,
        "default_instructions": "At bedtime",
    },
    {
        "brand_name": "Omez 20mg Cap.",
        "drug_name": "Omeprazole",
        "category": "Capsule",
        "default_dosage": "1 Cap",
        "default_frequency": "OD (1-0-0)",
        "default_days": 7,
        "default_instructions": "Before breakfast",
    },
    {
        "brand_name": "Meftal Spas Tab.",
        "drug_name": "Mefenamic Acid + Dicyclomine",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "SOS",
        "default_days": 3,
        "default_instructions": "For abdominal pain/spasm",
    },
    {
        "brand_name": "Clavam 625 Tab.",
        "drug_name": "Amoxicillin + Potassium Clavulanate",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "BD (1-0-1)",
        "default_days": 5,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Taxim-O 200mg Tab.",
        "drug_name": "Cefixime",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "BD (1-0-1)",
        "default_days": 5,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Allegra 120mg Tab.",
        "drug_name": "Fexofenadine Hydrochloride",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "OD (1-0-0)",
        "default_days": 7,
        "default_instructions": "Morning",
    },
    {
        "brand_name": "Rantac 150mg Tab.",
        "drug_name": "Ranitidine Hydrochloride",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "BD (1-0-1)",
        "default_days": 5,
        "default_instructions": "Before food",
    },
    {
        "brand_name": "Supradyn Daily Tab.",
        "drug_name": "Multivitamins & Minerals",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "OD (0-1-0)",
        "default_days": 30,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Neurobion Forte Tab.",
        "drug_name": "Vitamin B12 + B6 + B1",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "OD (0-0-1)",
        "default_days": 30,
        "default_instructions": "After dinner",
    },
    {
        "brand_name": "Dulcoflex 5mg Tab.",
        "drug_name": "Bisacodyl",
        "category": "Tablet",
        "default_dosage": "2 Tabs",
        "default_frequency": "HS (0-0-1)",
        "default_days": 2,
        "default_instructions": "At bedtime with warm water",
    },
    {
        "brand_name": "Digene Gel Orange",
        "drug_name": "Magaldrate + Simethicone",
        "category": "Syrup",
        "default_dosage": "10ml",
        "default_frequency": "TDS (1-1-1)",
        "default_days": 5,
        "default_instructions": "After meals",
    },
    {
        "brand_name": "Voveran 50mg Tab.",
        "drug_name": "Diclofenac Sodium",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "BD (1-0-1)",
        "default_days": 3,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Betadine 10% Ointment",
        "drug_name": "Povidone Iodine",
        "category": "Ointment",
        "default_dosage": "Apply",
        "default_frequency": "BD (1-0-1)",
        "default_days": 7,
        "default_instructions": "Clean and apply on wound",
    },
    {
        "brand_name": "Dynapar AQ Inj.",
        "drug_name": "Diclofenac Sodium",
        "category": "Injection",
        "default_dosage": "1 Inj",
        "default_frequency": "STAT",
        "default_days": 1,
        "default_instructions": "Deep IM injection",
    },
    {
        "brand_name": "Ondem 4mg Tab.",
        "drug_name": "Ondansetron",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "SOS",
        "default_days": 2,
        "default_instructions": "30 mins before food",
    },
    {
        "brand_name": "Ciplox 500mg Tab.",
        "drug_name": "Ciprofloxacin",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "BD (1-0-1)",
        "default_days": 5,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Metrogyl 400mg Tab.",
        "drug_name": "Metronidazole",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "TDS (1-1-1)",
        "default_days": 5,
        "default_instructions": "After meals",
    },
    {
        "brand_name": "Sporidex 500mg Cap.",
        "drug_name": "Cephalexin",
        "category": "Capsule",
        "default_dosage": "1 Cap",
        "default_frequency": "QID (1-1-1-1)",
        "default_days": 5,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Pantocid DSR Cap.",
        "drug_name": "Pantoprazole + Domperidone",
        "category": "Capsule",
        "default_dosage": "1 Cap",
        "default_frequency": "OD (1-0-0)",
        "default_days": 7,
        "default_instructions": "Morning empty stomach",
    },
    {
        "brand_name": "Asthalin 2mg Tab.",
        "drug_name": "Salbutamol Sulphate",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "TDS (1-1-1)",
        "default_days": 5,
        "default_instructions": "For wheezing/cough",
    },
    {
        "brand_name": "Deriphyllin Retard 150",
        "drug_name": "Theophylline + Etofylline",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "BD (1-0-1)",
        "default_days": 5,
        "default_instructions": "After food",
    },
    {
        "brand_name": "Ecosprin 75mg Tab.",
        "drug_name": "Aspirin (Acetylsalicylic Acid)",
        "category": "Tablet",
        "default_dosage": "1 Tab",
        "default_frequency": "OD (0-1-0)",
        "default_days": 30,
        "default_instructions": "After lunch",
    },
]


def seed_medicine_master():
    """Seed exactly 40 real-world drug records into the MedicineMaster dictionary"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Clear existing medicine master records
        db.query(MedicineMaster).delete()
        db.commit()

        inserted_count = 0
        for med in MEDICINE_MASTER_SEEDS:
            item = MedicineMaster(**med)
            db.add(item)
            inserted_count += 1

        db.commit()
        print(f"Successfully seeded {inserted_count} real-world MedicineMaster records.")
        return inserted_count
    except Exception as e:
        db.rollback()
        print(f"Error seeding MedicineMaster: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    count = seed_medicine_master()
    print(f"Verified {count} items in MedicineMaster database.")
