#!/bin/bash

# EMR Tables Migration Script
# This script will create all EMR tables in your database

echo "🔄 Creating EMR tables..."
echo ""

# Check if PostgreSQL is being used
if grep -q "postgresql" backend/.env 2>/dev/null; then
    echo "📊 Detected PostgreSQL database"
    echo ""
    echo "Please run one of these commands:"
    echo ""
    echo "Option 1: Using psql"
    echo "  psql -U clinic_user -d clinic_db -f backend/create_emr_tables.sql"
    echo ""
    echo "Option 2: Using alembic (recommended)"
    echo "  cd backend"
    echo "  source venv/bin/activate"
    echo "  alembic upgrade head"
    echo ""
    echo "Option 3: If database connection fails, start PostgreSQL first:"
    echo "  brew services start postgresql@14  # or your version"
    echo "  # Then try Option 2 again"
    echo ""
elif grep -q "sqlite" backend/.env 2>/dev/null; then
    echo "📊 Detected SQLite database"
    echo ""
    DB_FILE=$(grep "sqlite" backend/.env | cut -d'=' -f2 | tr -d ' ')
    if [ -z "$DB_FILE" ]; then
        DB_FILE="clinic.db"
    fi
    echo "Running migration on: $DB_FILE"
    sqlite3 "$DB_FILE" < backend/create_emr_tables_sqlite.sql
    echo "✅ Migration completed!"
else
    echo "⚠️  Could not detect database type from .env"
    echo ""
    echo "Please run the migration manually:"
    echo ""
    echo "For PostgreSQL:"
    echo "  psql -U clinic_user -d clinic_db -f backend/create_emr_tables.sql"
    echo ""
    echo "For SQLite:"
    echo "  sqlite3 your_database.db < backend/create_emr_tables_sqlite.sql"
    echo ""
fi
