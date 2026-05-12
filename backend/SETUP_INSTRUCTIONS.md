# Complete Setup Instructions

## Step 1: Fix Database Permissions

Open a terminal and connect to PostgreSQL:

```bash
psql -d postgres
```

Then run these SQL commands:

```sql
\c clinic_db
GRANT USAGE ON SCHEMA public TO clinic_user;
GRANT CREATE ON SCHEMA public TO clinic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO clinic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO clinic_user;
\q
```

## Step 2: Run Migrations

```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./venv/bin/alembic upgrade head
```

## Step 3: Initialize Default Users

```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
PYTHONPATH="$(pwd)" ./venv/bin/python -m app.init_db
```

## Step 4: Start the Server

```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./venv/bin/uvicorn app.main:app --reload
```

## Quick Copy-Paste Commands

Run these in order:

```bash
# 1. Fix permissions (run in psql)
psql -d postgres -c "\c clinic_db; GRANT USAGE ON SCHEMA public TO clinic_user; GRANT CREATE ON SCHEMA public TO clinic_user; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO clinic_user; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO clinic_user;"

# 2. Run migrations
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend" && ./venv/bin/alembic upgrade head

# 3. Initialize users
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend" && PYTHONPATH="$(pwd)" ./venv/bin/python -m app.init_db

# 4. Start server
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend" && ./venv/bin/uvicorn app.main:app --reload
```

## Default Login Credentials

After running init_db.py:

- **Admin**: `admin` / `admin123`
- **Doctor**: `doctor` / `doctor123`
- **Reception**: `reception` / `reception123`
