-- EMR Tables Migration SQL Script for SQLite
-- Run this if you're using SQLite database

-- Master Tables
CREATE TABLE IF NOT EXISTS chief_complaints_master (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_chief_complaints_master_id ON chief_complaints_master(id);
CREATE INDEX IF NOT EXISTS ix_chief_complaints_master_name ON chief_complaints_master(name);

CREATE TABLE IF NOT EXISTS diagnosis_master (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_diagnosis_master_id ON diagnosis_master(id);
CREATE INDEX IF NOT EXISTS ix_diagnosis_master_name ON diagnosis_master(name);

CREATE TABLE IF NOT EXISTS doctor_advice_master (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_doctor_advice_master_id ON doctor_advice_master(id);
CREATE INDEX IF NOT EXISTS ix_doctor_advice_master_name ON doctor_advice_master(name);

CREATE TABLE IF NOT EXISTS lab_tests_master (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    test_type TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_lab_tests_master_id ON lab_tests_master(id);
CREATE INDEX IF NOT EXISTS ix_lab_tests_master_name ON lab_tests_master(name);

-- Patient History Tables
CREATE TABLE IF NOT EXISTS patient_allergy_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    value TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_patient_allergy_history_id ON patient_allergy_history(id);
CREATE INDEX IF NOT EXISTS ix_patient_allergy_history_patient_id ON patient_allergy_history(patient_id);

CREATE TABLE IF NOT EXISTS patient_family_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    value TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_patient_family_history_id ON patient_family_history(id);
CREATE INDEX IF NOT EXISTS ix_patient_family_history_patient_id ON patient_family_history(patient_id);

CREATE TABLE IF NOT EXISTS patient_surgical_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    value TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_patient_surgical_history_id ON patient_surgical_history(id);
CREATE INDEX IF NOT EXISTS ix_patient_surgical_history_patient_id ON patient_surgical_history(patient_id);

CREATE TABLE IF NOT EXISTS patient_past_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    value TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_patient_past_history_id ON patient_past_history(id);
CREATE INDEX IF NOT EXISTS ix_patient_past_history_patient_id ON patient_past_history(patient_id);

-- Visit Relation Tables
CREATE TABLE IF NOT EXISTS visit_complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL REFERENCES visits(id),
    complaint_id INTEGER REFERENCES chief_complaints_master(id),
    custom_complaint TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_visit_complaints_id ON visit_complaints(id);
CREATE INDEX IF NOT EXISTS ix_visit_complaints_visit_id ON visit_complaints(visit_id);

CREATE TABLE IF NOT EXISTS visit_diagnosis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL REFERENCES visits(id),
    diagnosis_id INTEGER REFERENCES diagnosis_master(id),
    custom_diagnosis TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_visit_diagnosis_id ON visit_diagnosis(id);
CREATE INDEX IF NOT EXISTS ix_visit_diagnosis_visit_id ON visit_diagnosis(visit_id);

CREATE TABLE IF NOT EXISTS visit_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL UNIQUE REFERENCES visits(id),
    doctor_fee REAL DEFAULT 0.0,
    lab_fee REAL DEFAULT 0.0,
    total REAL DEFAULT 0.0,
    payment_status TEXT DEFAULT 'pending',
    payment_mode TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_visit_payments_id ON visit_payments(id);
CREATE INDEX IF NOT EXISTS ix_visit_payments_visit_id ON visit_payments(visit_id);

-- Add instructions column to prescription_drugs if it doesn't exist
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we check first
-- You may need to run this manually if the column doesn't exist:
-- ALTER TABLE prescription_drugs ADD COLUMN instructions TEXT;
