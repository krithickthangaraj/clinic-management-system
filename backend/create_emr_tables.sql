-- EMR Tables Migration SQL Script
-- Run this script directly in your database to create all EMR tables
-- Usage: psql -U clinic_user -d clinic_db -f create_emr_tables.sql
-- Or: sqlite3 clinic.db < create_emr_tables.sql (for SQLite)

-- Master Tables
CREATE TABLE IF NOT EXISTS chief_complaints_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_chief_complaints_master_id ON chief_complaints_master(id);
CREATE INDEX IF NOT EXISTS ix_chief_complaints_master_name ON chief_complaints_master(name);

CREATE TABLE IF NOT EXISTS diagnosis_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_diagnosis_master_id ON diagnosis_master(id);
CREATE INDEX IF NOT EXISTS ix_diagnosis_master_name ON diagnosis_master(name);

CREATE TABLE IF NOT EXISTS doctor_advice_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_doctor_advice_master_id ON doctor_advice_master(id);
CREATE INDEX IF NOT EXISTS ix_doctor_advice_master_name ON doctor_advice_master(name);

CREATE TABLE IF NOT EXISTS lab_tests_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    test_type VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_lab_tests_master_id ON lab_tests_master(id);
CREATE INDEX IF NOT EXISTS ix_lab_tests_master_name ON lab_tests_master(name);

-- Patient History Tables
CREATE TABLE IF NOT EXISTS patient_allergy_history (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_patient_allergy_history_id ON patient_allergy_history(id);
CREATE INDEX IF NOT EXISTS ix_patient_allergy_history_patient_id ON patient_allergy_history(patient_id);

CREATE TABLE IF NOT EXISTS patient_family_history (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_patient_family_history_id ON patient_family_history(id);
CREATE INDEX IF NOT EXISTS ix_patient_family_history_patient_id ON patient_family_history(patient_id);

CREATE TABLE IF NOT EXISTS patient_surgical_history (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_patient_surgical_history_id ON patient_surgical_history(id);
CREATE INDEX IF NOT EXISTS ix_patient_surgical_history_patient_id ON patient_surgical_history(patient_id);

CREATE TABLE IF NOT EXISTS patient_past_history (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_patient_past_history_id ON patient_past_history(id);
CREATE INDEX IF NOT EXISTS ix_patient_past_history_patient_id ON patient_past_history(patient_id);

-- Visit Relation Tables
CREATE TABLE IF NOT EXISTS visit_complaints (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER NOT NULL REFERENCES visits(id),
    complaint_id INTEGER REFERENCES chief_complaints_master(id),
    custom_complaint VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_visit_complaints_id ON visit_complaints(id);
CREATE INDEX IF NOT EXISTS ix_visit_complaints_visit_id ON visit_complaints(visit_id);

CREATE TABLE IF NOT EXISTS visit_diagnosis (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER NOT NULL REFERENCES visits(id),
    diagnosis_id INTEGER REFERENCES diagnosis_master(id),
    custom_diagnosis VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_visit_diagnosis_id ON visit_diagnosis(id);
CREATE INDEX IF NOT EXISTS ix_visit_diagnosis_visit_id ON visit_diagnosis(visit_id);

CREATE TABLE IF NOT EXISTS visit_payments (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER NOT NULL UNIQUE REFERENCES visits(id),
    doctor_fee FLOAT DEFAULT 0.0,
    lab_fee FLOAT DEFAULT 0.0,
    total FLOAT DEFAULT 0.0,
    payment_status VARCHAR DEFAULT 'pending',
    payment_mode VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS ix_visit_payments_id ON visit_payments(id);
CREATE INDEX IF NOT EXISTS ix_visit_payments_visit_id ON visit_payments(visit_id);

-- Add instructions column to prescription_drugs if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prescription_drugs' AND column_name = 'instructions'
    ) THEN
        ALTER TABLE prescription_drugs ADD COLUMN instructions TEXT;
    END IF;
END $$;
