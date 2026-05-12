#!/usr/bin/env python3
"""
Direct table creation script for EMR tables.
This bypasses Alembic and creates tables directly using SQLAlchemy.
Run this if migrations are not working.
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models.master import (
    ChiefComplaintMaster, DiagnosisMaster, DoctorAdviceMaster, LabTestMaster
)
from app.models.patient_history import (
    PatientAllergyHistory, PatientFamilyHistory, PatientSurgicalHistory, PatientPastHistory
)
from app.models.visit_relations import VisitComplaint, VisitDiagnosis, VisitPayment
from app.models.prescription import PrescriptionDrug

def create_emr_tables():
    """Create all EMR tables directly."""
    print("🔄 Creating EMR tables directly...")
    print()
    print("Creating:")
    print("  ✓ Master tables (complaints, diagnosis, advice, lab_tests)")
    print("  ✓ Patient history tables (allergy, family, surgical, past)")
    print("  ✓ Visit relation tables (complaints, diagnosis, payments)")
    print("  ✓ Adding instructions column to prescription_drugs")
    print()
    
    try:
        # Import all models to register them with Base.metadata
        from app.models import (
            ChiefComplaintMaster, DiagnosisMaster, DoctorAdviceMaster, LabTestMaster,
            PatientAllergyHistory, PatientFamilyHistory, PatientSurgicalHistory, PatientPastHistory,
            VisitComplaint, VisitDiagnosis, VisitPayment
        )
        
        # Create only the EMR tables we need (to avoid creating all tables)
        tables_to_create = [
            ChiefComplaintMaster.__table__,
            DiagnosisMaster.__table__,
            DoctorAdviceMaster.__table__,
            LabTestMaster.__table__,
            PatientAllergyHistory.__table__,
            PatientFamilyHistory.__table__,
            PatientSurgicalHistory.__table__,
            PatientPastHistory.__table__,
            VisitComplaint.__table__,
            VisitDiagnosis.__table__,
            VisitPayment.__table__,
        ]
        
        # Create tables one by one with error handling
        for table in tables_to_create:
            try:
                table.create(engine, checkfirst=True)
                print(f"  ✓ Created table: {table.name}")
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    print(f"  ⚠️  Table {table.name} already exists (skipping)")
                else:
                    raise
        
        # Add instructions column to prescription_drugs if it doesn't exist
        from sqlalchemy import inspect, text
        from app.core.database import SessionLocal
        
        db = SessionLocal()
        try:
            inspector = inspect(engine)
            columns = [col['name'] for col in inspector.get_columns('prescription_drugs')]
            
            if 'instructions' not in columns:
                print("Adding 'instructions' column to prescription_drugs...")
                db.execute(text("ALTER TABLE prescription_drugs ADD COLUMN instructions TEXT"))
                db.commit()
                print("  ✓ Added instructions column")
            else:
                print("  ✓ Instructions column already exists")
        except Exception as e:
            print(f"  ⚠️  Could not add instructions column: {e}")
            db.rollback()
        finally:
            db.close()
        
        print()
        print("✅ All EMR tables created successfully!")
        print()
        print("You can now use the consultation page with full EMR features.")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        print()
        print("Please check:")
        print("1. Database is running and accessible")
        print("2. Database connection string in .env is correct")
        print("3. You have proper database permissions")
        return False

if __name__ == "__main__":
    success = create_emr_tables()
    sys.exit(0 if success else 1)
