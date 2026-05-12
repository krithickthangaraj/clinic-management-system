#!/bin/bash

# PostgreSQL Database Setup Script
# Run this script to create the database and user

echo "🔧 Setting up PostgreSQL database for Clinic Management System..."
echo ""

# Try different connection methods
PSQL_CMD=""

# Method 1: Try with current user
if psql -U $USER -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
    PSQL_CMD="psql -U $USER -d postgres"
    echo "✅ Connected as user: $USER"
# Method 2: Try without user (peer auth)
elif psql -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
    PSQL_CMD="psql -d postgres"
    echo "✅ Connected with peer authentication"
# Method 3: Try with localhost
elif psql -h localhost -U postgres -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
    PSQL_CMD="psql -h localhost -U postgres -d postgres"
    echo "✅ Connected via localhost"
else
    echo "❌ Cannot connect to PostgreSQL"
    echo ""
    echo "Please run these commands manually:"
    echo ""
    echo "  psql -d postgres"
    echo ""
    echo "Then in PostgreSQL shell, run:"
    echo "  CREATE DATABASE clinic_db;"
    echo "  CREATE USER clinic_user WITH PASSWORD 'clinic_password';"
    echo "  GRANT ALL PRIVILEGES ON DATABASE clinic_db TO clinic_user;"
    echo "  \\q"
    exit 1
fi

echo ""
echo "Creating database and user..."

# Create database
$PSQL_CMD -c "CREATE DATABASE clinic_db;" 2>/dev/null && echo "✅ Database 'clinic_db' created" || echo "⚠️  Database may already exist"

# Create user
$PSQL_CMD -c "CREATE USER clinic_user WITH PASSWORD 'clinic_password';" 2>/dev/null && echo "✅ User 'clinic_user' created" || echo "⚠️  User may already exist"

# Grant privileges
$PSQL_CMD -c "GRANT ALL PRIVILEGES ON DATABASE clinic_db TO clinic_user;" 2>/dev/null && echo "✅ Privileges granted" || echo "⚠️  Could not grant privileges"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "You can test the connection with:"
echo "  psql -U clinic_user -d clinic_db"
