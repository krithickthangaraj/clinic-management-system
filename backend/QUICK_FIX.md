# Quick Fix: Create EMR Tables

## The Problem
Error: `doctor_advice_master does not exist` - The EMR tables haven't been created yet.

## The Solution (3 Steps)

### Step 1: Start PostgreSQL

Open Terminal and run:
```bash
# Try one of these commands:
brew services start postgresql@16
# OR
brew services start postgresql@15
# OR
brew services start postgresql@14
```

Wait 5-10 seconds for PostgreSQL to start.

### Step 2: Verify PostgreSQL is Running

```bash
/opt/homebrew/opt/postgresql@16/bin/pg_isready -h localhost -p 5432
```

You should see: `localhost:5432 - accepting connections`

### Step 3: Run Migration

```bash
cd backend
source venv/bin/activate
python3 create_tables_direct.py
```

You should see: `✅ All EMR tables created successfully!`

## Alternative: If PostgreSQL Won't Start

If you can't start PostgreSQL, you can:

1. **Check if it's already running:**
   ```bash
   ps aux | grep postgres
   ```

2. **Start manually:**
   ```bash
   /opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /opt/homebrew/var/postgresql@16 start
   ```

3. **Or use SQLite temporarily** (change DATABASE_URL in .env to SQLite)

## After Migration

1. **Restart your FastAPI server** (if it's running)
2. **Try adding a complaint** - it should work now!
3. All APIs will function correctly

## What Tables Are Created?

- ✅ `chief_complaints_master`
- ✅ `diagnosis_master`
- ✅ `doctor_advice_master` ← This fixes your error!
- ✅ `lab_tests_master`
- ✅ `patient_allergy_history`
- ✅ `patient_family_history`
- ✅ `patient_surgical_history`
- ✅ `patient_past_history`
- ✅ `visit_complaints`
- ✅ `visit_diagnosis`
- ✅ `visit_payments`
- ✅ `prescription_drugs.instructions` (column added)

## Still Having Issues?

Check the detailed guide: `MIGRATION_GUIDE.md`
