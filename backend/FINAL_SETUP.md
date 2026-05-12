# Final Setup - Fix Permissions and Run

## Step 1: Fix Database Permissions

You have two options:

### Option A: Using SQL file (Easiest)

```bash
psql -d clinic_db -f "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend/fix_permissions.sql"
```

### Option B: Manual (if Option A doesn't work)

```bash
psql -d clinic_db
```

Then copy-paste these commands:

```sql
GRANT USAGE ON SCHEMA public TO clinic_user;
GRANT CREATE ON SCHEMA public TO clinic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO clinic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO clinic_user;
\q
```

## Step 2: Create Migration File

```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./venv/bin/alembic revision --autogenerate -m "Initial migration"
```

## Step 3: Run Migrations (Create Tables)

```bash
./venv/bin/alembic upgrade head
```

## Step 4: Initialize Users

```bash
PYTHONPATH="$(pwd)" ./venv/bin/python -m app.init_db
```

You should see:
```
Default users created successfully!

Default credentials:
Admin: admin / admin123
Doctor: doctor / doctor123
Reception: reception / reception123
```

## Step 5: Start Server

```bash
./venv/bin/uvicorn app.main:app --reload
```

## All Commands in One Block

```bash
# Step 1: Fix permissions
psql -d clinic_db -f "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend/fix_permissions.sql"

# Step 2-5: Setup and run
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./venv/bin/alembic revision --autogenerate -m "Initial migration"
./venv/bin/alembic upgrade head
PYTHONPATH="$(pwd)" ./venv/bin/python -m app.init_db
./venv/bin/uvicorn app.main:app --reload
```
