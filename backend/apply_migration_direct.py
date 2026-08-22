import os
from sqlalchemy import text
from app.core.database import engine

def apply_migrations():
    print("Applying hospital fields migrations...")
    with engine.begin() as conn:
        # Check dialect
        dialect = engine.dialect.name
        print(f"Database dialect: {dialect}")

        # Patients table additions
        patient_cols = [
            ("patient_id", "VARCHAR"),
            ("barcode", "VARCHAR"),
            ("registration_timestamp", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP" if dialect == "postgresql" else "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("dob", "DATE"),
            ("age_format", "VARCHAR DEFAULT 'Years'"),
            ("guardian_relation", "VARCHAR"),
        ]
        for col_name, col_type in patient_cols:
            try:
                if dialect == "postgresql":
                    conn.execute(text(f"ALTER TABLE patients ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                else:
                    conn.execute(text(f"ALTER TABLE patients ADD COLUMN {col_name} {col_type};"))
                print(f"Added patient column: {col_name}")
            except Exception as e:
                print(f"Patient col {col_name} check/skip: {e}")

        # Vitals table additions
        vitals_cols = [
            ("weight_kg", "FLOAT"),
            ("bmi", "FLOAT"),
            ("blood_pressure", "VARCHAR"),
            ("temperature_f", "FLOAT"),
            ("spo2_percent", "INTEGER"),
            ("pulse_rate_bpm", "INTEGER"),
            ("grbs_mg_dl", "INTEGER"),
            ("consultant_assigned", "VARCHAR"),
            ("remarks", "TEXT"),
        ]
        for col_name, col_type in vitals_cols:
            try:
                if dialect == "postgresql":
                    conn.execute(text(f"ALTER TABLE vitals ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                else:
                    conn.execute(text(f"ALTER TABLE vitals ADD COLUMN {col_name} {col_type};"))
                print(f"Added vitals column: {col_name}")
            except Exception as e:
                print(f"Vitals col {col_name} check/skip: {e}")

        # Visits table additions
        visit_cols = [
            ("consultant_assigned", "VARCHAR"),
        ]
        for col_name, col_type in visit_cols:
            try:
                if dialect == "postgresql":
                    conn.execute(text(f"ALTER TABLE visits ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                else:
                    conn.execute(text(f"ALTER TABLE visits ADD COLUMN {col_name} {col_type};"))
                print(f"Added visit column: {col_name}")
            except Exception as e:
                print(f"Visit col {col_name} check/skip: {e}")

        # Populate patient_id and barcode for existing records if null
        try:
            conn.execute(text("""
                UPDATE patients 
                SET patient_id = 'PAT-' || LPAD(id::text, 5, '0'),
                    barcode = 'PAT-' || LPAD(id::text, 5, '0')
                WHERE patient_id IS NULL;
            """))
            print("Populated missing patient_ids for existing records.")
        except Exception as e:
            print(f"Could not backfill patient_id: {e}")

    print("Migration applied successfully!")

if __name__ == "__main__":
    apply_migrations()
