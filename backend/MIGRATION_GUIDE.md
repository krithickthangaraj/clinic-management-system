# EMR Tables Migration Guide

## Problem
The error "doctor_advice_master does not exist" means the EMR tables haven't been created yet.

## Solution: Run Migration

### Step 1: Start PostgreSQL

**On macOS:**
```bash
# Check if PostgreSQL is installed
brew services list | grep postgresql

# Start PostgreSQL (try one of these):
brew services start postgresql@14
# OR
brew services start postgresql@15
# OR
brew services start postgresql@16

# Verify it's running
brew services list | grep postgresql
```

**If PostgreSQL is not installed:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Step 2: Verify Database Connection

```bash
# Test connection
psql -U clinic_user -d clinic_db -c "SELECT 1;"
```

If this fails, you may need to create the database first:
```bash
psql -U postgres -d postgres
# Then in psql:
CREATE DATABASE clinic_db;
CREATE USER clinic_user WITH PASSWORD 'clinic_password';
GRANT ALL PRIVILEGES ON DATABASE clinic_db TO clinic_user;
\q
```

### Step 3: Run Migration

**Option A: Using Alembic (Recommended)**
```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

**Option B: Direct Python Script**
```bash
cd backend
source venv/bin/activate
python3 create_tables_direct.py
```

**Option C: Using SQL Script**
```bash
psql -U clinic_user -d clinic_db -f backend/create_emr_tables.sql
```

### Step 4: Verify Tables Created

```bash
psql -U clinic_user -d clinic_db -c "\dt" | grep -E "(master|history|visit_|payment)"
```

You should see:
- chief_complaints_master
- diagnosis_master
- doctor_advice_master
- lab_tests_master
- patient_allergy_history
- patient_family_history
- patient_surgical_history
- patient_past_history
- visit_complaints
- visit_diagnosis
- visit_payments

## Quick Fix Script

Run this complete setup:
```bash
cd backend
source venv/bin/activate

# Start PostgreSQL (if not running)
brew services start postgresql@14 || brew services start postgresql@15 || brew services start postgresql@16

# Wait a moment for PostgreSQL to start
sleep 3

# Run migration
python3 create_tables_direct.py
```

## Troubleshooting

### "Operation not permitted" error
- PostgreSQL is not running → Start it with `brew services start postgresql@XX`
- Firewall blocking → Check macOS firewall settings
- Wrong port → Check PostgreSQL is on port 5432

### "Database does not exist"
- Create it: `createdb -U postgres clinic_db`
- Or use psql: `psql -U postgres -c "CREATE DATABASE clinic_db;"`

### "Permission denied"
- Grant permissions: `GRANT ALL PRIVILEGES ON DATABASE clinic_db TO clinic_user;`
- Or run as postgres user: `sudo -u postgres psql`

## After Migration

Once tables are created:
1. Restart your FastAPI backend server
2. Try adding a complaint again - it should work!
3. All APIs should now function correctly
