# How to Run the Backend

## Quick Start

```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./venv/bin/uvicorn app.main:app --reload
```

## Full Setup (First Time)

### Step 1: Set up Database

Make sure PostgreSQL is running and create the database:

```bash
# Connect to PostgreSQL
psql -d postgres

# In PostgreSQL shell, run:
CREATE DATABASE clinic_db;
CREATE USER clinic_user WITH PASSWORD 'clinic_password';
GRANT ALL PRIVILEGES ON DATABASE clinic_db TO clinic_user;
\q
```

### Step 2: Run Migrations

```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./venv/bin/alembic upgrade head
```

### Step 3: Initialize Default Users

```bash
./venv/bin/python app/init_db.py
```

### Step 4: Start the Server

```bash
./venv/bin/uvicorn app.main:app --reload
```

## Server URLs

Once running, the server will be available at:

- **API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc

## Default Login Credentials

After running `init_db.py`:

- **Admin**: `admin` / `admin123`
- **Doctor**: `doctor` / `doctor123`
- **Reception**: `reception` / `reception123`

## Troubleshooting

### "Database connection failed"
- Check PostgreSQL is running: `brew services list | grep postgresql`
- Verify `.env` file has correct `DATABASE_URL`
- Make sure database exists

### "Module not found"
- Activate venv: `source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`

### "Port already in use"
- Change port: `./venv/bin/uvicorn app.main:app --reload --port 8001`
