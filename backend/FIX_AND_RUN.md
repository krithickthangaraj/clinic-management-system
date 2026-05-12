# Fix Database Permissions and Run Setup

## The Problem
The error "relation 'users' does not exist" means the database tables haven't been created yet. You need to:
1. Fix database permissions
2. Create the migration file
3. Run migrations to create tables
4. Initialize users

## Step-by-Step Solution

### Step 1: Fix Database Permissions

Open a terminal and run:

```bash
psql -d postgres
```

Then copy and paste these SQL commands:

```sql
\c clinic_db
GRANT USAGE ON SCHEMA public TO clinic_user;
GRANT CREATE ON SCHEMA public TO clinic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO clinic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO clinic_user;
\q
```

### Step 2: Create Migration File

```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./venv/bin/alembic revision --autogenerate -m "Initial migration"
```

This will create a migration file in `alembic/versions/` directory.

### Step 3: Run Migrations (Create Tables)

```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./venv/bin/alembic upgrade head
```

This will create all the database tables.

### Step 4: Initialize Default Users

```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
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

### Step 5: Start the Server

```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./venv/bin/uvicorn app.main:app --reload
```

## Quick Copy-Paste (All Steps)

Run these commands in order:

```bash
# Step 1: Fix permissions (in psql)
psql -d postgres -c "\c clinic_db; GRANT USAGE ON SCHEMA public TO clinic_user; GRANT CREATE ON SCHEMA public TO clinic_user; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO clinic_user; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO clinic_user;"

# Step 2: Create migration
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./venv/bin/alembic revision --autogenerate -m "Initial migration"

# Step 3: Run migrations
./venv/bin/alembic upgrade head

# Step 4: Initialize users
PYTHONPATH="$(pwd)" ./venv/bin/python -m app.init_db

# Step 5: Start server
./venv/bin/uvicorn app.main:app --reload
```

## Login Credentials (After Step 4)

- **Admin**: `admin` / `admin123`
- **Doctor**: `doctor` / `doctor123`
- **Reception**: `reception` / `reception123`
