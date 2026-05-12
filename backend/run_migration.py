#!/usr/bin/env python3
"""
Run the EMR tables migration.
This script will create all the master tables, patient history tables, and visit relation tables.
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from alembic.config import Config
from alembic import command

def run_migration():
    """Run the migration to create EMR tables."""
    alembic_cfg = Config("alembic.ini")
    
    print("🔄 Running migration to create EMR tables...")
    print("   - Master tables (complaints, diagnosis, advice, lab_tests)")
    print("   - Patient history tables (allergy, family, surgical, past)")
    print("   - Visit relation tables (complaints, diagnosis, payments)")
    print("   - Adding instructions column to prescription_drugs")
    print()
    
    try:
        # Run the migration
        command.upgrade(alembic_cfg, "head")
        print("✅ Migration completed successfully!")
        print()
        print("All EMR tables have been created.")
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print()
        print("Please check:")
        print("1. Database is running and accessible")
        print("2. Database connection string in .env is correct")
        print("3. Previous migrations have been applied")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
