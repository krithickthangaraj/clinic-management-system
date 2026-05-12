#!/bin/bash

# Complete Setup Script for Clinic Management System
# Run this script to set up everything

set -e

echo "🚀 Clinic Management System - Complete Setup"
echo "=============================================="
echo ""

cd "$(dirname "$0")"

# Step 1: Fix Database Permissions
echo "📋 Step 1: Database Permissions"
echo "---------------------------------"
echo ""
echo "Please run these SQL commands in PostgreSQL:"
echo ""
echo "  psql -d postgres"
echo ""
echo "Then run:"
echo ""
cat << 'EOF'
  \c clinic_db
  GRANT USAGE ON SCHEMA public TO clinic_user;
  GRANT CREATE ON SCHEMA public TO clinic_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO clinic_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO clinic_user;
  \q
EOF
echo ""
read -p "Press Enter after you've run the SQL commands above..."

# Step 2: Run Migrations
echo ""
echo "🔄 Step 2: Running Database Migrations"
echo "---------------------------------------"
./venv/bin/alembic upgrade head
echo "✅ Migrations completed"
echo ""

# Step 3: Initialize Default Users
echo "👥 Step 3: Initializing Default Users"
echo "--------------------------------------"
cd "$(dirname "$0")"
PYTHONPATH="$(pwd)" ./venv/bin/python -m app.init_db
echo "✅ Default users created"
echo ""

# Step 4: Start Server
echo "🌟 Step 4: Starting Server"
echo "-------------------------"
echo ""
echo "✅ Setup complete! Starting server..."
echo "   API: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo ""
./venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
