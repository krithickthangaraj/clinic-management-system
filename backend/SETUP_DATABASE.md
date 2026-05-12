# PostgreSQL Database Setup

## Issue
PostgreSQL is running but there are permission issues connecting via command line.

## Solution: Manual Setup

### Step 1: Connect to PostgreSQL

Open a new terminal and try one of these:

```bash
# Option 1: Connect as your user
psql -d postgres

# Option 2: Connect as postgres user
psql -U postgres -d postgres

# Option 3: If you have pgAdmin or another GUI tool, use that
```

### Step 2: Create Database and User

Once connected to PostgreSQL, run these SQL commands:

```sql
-- Create database
CREATE DATABASE clinic_db;

-- Create user
CREATE USER clinic_user WITH PASSWORD 'clinic_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE clinic_db TO clinic_user;

-- Exit
\q
```

### Step 3: Test Connection

```bash
psql -U clinic_user -d clinic_db -c "SELECT version();"
```

### Alternative: Use Your Current User

If you can't create a separate user, you can use your current macOS user:

1. Update `backend/.env`:
   ```
   DATABASE_URL=postgresql://$USER@localhost:5432/clinic_db
   ```
   (Replace `$USER` with your actual username, e.g., `mac`)

2. Create database only:
   ```sql
   CREATE DATABASE clinic_db;
   ```

## After Setup

Once the database is created, run:

```bash
cd backend
./venv/bin/alembic upgrade head
./venv/bin/python app/init_db.py
./venv/bin/uvicorn app.main:app --reload
```
