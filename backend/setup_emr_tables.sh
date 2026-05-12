#!/bin/bash

# EMR Tables Setup Script
# This script will start PostgreSQL (if needed) and create all EMR tables

echo "🔧 EMR Tables Setup"
echo "==================="
echo ""

# Check if PostgreSQL is running
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
else
    echo "⚠️  PostgreSQL is not running"
    echo ""
    echo "Please start PostgreSQL first:"
    echo ""
    echo "  Option 1: Using Homebrew"
    echo "    brew services start postgresql@14"
    echo "    # OR"
    echo "    brew services start postgresql@15"
    echo "    # OR"
    echo "    brew services start postgresql@16"
    echo ""
    echo "  Option 2: Using pg_ctl"
    echo "    pg_ctl -D /usr/local/var/postgres start"
    echo ""
    echo "  Option 3: Using launchctl (macOS)"
    echo "    launchctl load ~/Library/LaunchAgents/homebrew.mxcl.postgresql*.plist"
    echo ""
    read -p "Press Enter after starting PostgreSQL, or Ctrl+C to cancel..."
    echo ""
fi

# Check connection
echo "🔍 Testing database connection..."
if psql -U clinic_user -d clinic_db -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database"
    echo ""
    echo "Please check:"
    echo "1. Database 'clinic_db' exists"
    echo "2. User 'clinic_user' exists with correct password"
    echo "3. Connection string in .env is correct"
    echo ""
    echo "To create database manually:"
    echo "  psql -U postgres -d postgres"
    echo "  CREATE DATABASE clinic_db;"
    echo "  CREATE USER clinic_user WITH PASSWORD 'clinic_password';"
    echo "  GRANT ALL PRIVILEGES ON DATABASE clinic_db TO clinic_user;"
    exit 1
fi

echo ""
echo "🔄 Running migration..."
echo ""

cd "$(dirname "$0")"
source venv/bin/activate

# Try direct Python script first (faster)
if python3 create_tables_direct.py; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "All EMR tables have been created:"
    echo "  ✓ chief_complaints_master"
    echo "  ✓ diagnosis_master"
    echo "  ✓ doctor_advice_master"
    echo "  ✓ lab_tests_master"
    echo "  ✓ patient_allergy_history"
    echo "  ✓ patient_family_history"
    echo "  ✓ patient_surgical_history"
    echo "  ✓ patient_past_history"
    echo "  ✓ visit_complaints"
    echo "  ✓ visit_diagnosis"
    echo "  ✓ visit_payments"
    echo ""
    echo "You can now use the consultation page with full EMR features!"
    exit 0
else
    echo ""
    echo "⚠️  Direct script failed, trying Alembic..."
    if alembic upgrade head; then
        echo "✅ Migration completed with Alembic!"
        exit 0
    else
        echo "❌ Both migration methods failed"
        echo ""
        echo "Please check the error messages above"
        exit 1
    fi
fi
