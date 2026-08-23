#!/usr/bin/env python3
"""
Safe database schema update script for Settings and Reports.
Adds missing columns to `users` and creates `hospital_settings`, `procedure_master`, `referral_master` tables.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine, Base
import app.models  # Register all models with Base.metadata


def apply_schema_updates():
    print("🔄 Connecting to database to apply schema updates...")
    with engine.begin() as conn:
        # 1. Update `users` table with missing columns
        print("Checking `users` table columns...")
        user_columns = [
            ("phone", "VARCHAR"),
            ("department", "VARCHAR"),
            ("qualification", "VARCHAR"),
            ("created_at", "TIMESTAMPTZ DEFAULT NOW()"),
            ("updated_at", "TIMESTAMPTZ"),
        ]
        for col_name, col_type in user_columns:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                print(f"  ✓ Added column `users.{col_name}` (if not exists)")
            except Exception as e:
                print(f"  ⚠️ Could not alter column `{col_name}`: {e}")

        # 2. Create any missing tables (hospital_settings, procedure_master, referral_master, etc.)
        print("\nCreating missing tables registered with Base.metadata...")
        Base.metadata.create_all(bind=conn)
        print("  ✓ `hospital_settings`, `procedure_master`, `referral_master` created/verified.")

    print("\n✅ Database schema successfully migrated!")


if __name__ == "__main__":
    apply_schema_updates()
