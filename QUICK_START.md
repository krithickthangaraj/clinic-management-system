# Quick Start Guide

## Current Status

⚠️ **Network connectivity required** to install dependencies.

## Once You Have Internet Connection

### Option 1: Use the Startup Scripts (Recommended)

**Terminal 1 - Backend:**
```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./start.sh
```

**Terminal 2 - Frontend:**
```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/frontend"
./start.sh
```

### Option 2: Manual Setup

**1. Backend Setup:**
```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"

# Install dependencies
./venv/bin/pip install -r requirements.txt

# Set up database (if not done)
# Edit .env file with your PostgreSQL credentials

# Run migrations
./venv/bin/alembic upgrade head

# Initialize default users
./venv/bin/python app/init_db.py

# Start server
./venv/bin/uvicorn app.main:app --reload
```

**2. Frontend Setup:**
```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/frontend"

# Install dependencies
npm install

# Start server
npm run dev
```

## Database Setup (First Time Only)

If you haven't set up the database yet:

```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL shell:
CREATE DATABASE clinic_db;
CREATE USER clinic_user WITH PASSWORD 'clinic_password';
GRANT ALL PRIVILEGES ON DATABASE clinic_db TO clinic_user;
\q
```

Then update `backend/.env`:
```
DATABASE_URL=postgresql://clinic_user:clinic_password@localhost:5432/clinic_db
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Default Login Credentials

- **Admin**: `admin` / `admin123`
- **Doctor**: `doctor` / `doctor123`
- **Reception**: `reception` / `reception123`

## Troubleshooting

### "uvicorn: command not found"
- Dependencies not installed - run `./venv/bin/pip install -r requirements.txt`

### "Database connection failed"
- Check PostgreSQL is running: `brew services list` (macOS)
- Verify `.env` file has correct `DATABASE_URL`
- Ensure database and user exist

### "Port already in use"
- Backend: Change port with `--port 8001`
- Frontend: Change in `vite.config.js` or use `npm run dev -- --port 5174`
