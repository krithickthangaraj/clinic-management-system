# Setup Guide

Complete step-by-step guide to set up the Clinic Management System.

## Prerequisites

Before starting, ensure you have:

1. **Python 3.9+** - Check with `python --version`
2. **Node.js 18+** - Check with `node --version`
3. **PostgreSQL 14+** - Check with `psql --version`
4. **Git** (optional) - For version control

## Step 1: Database Setup

### Install PostgreSQL

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### Create Database and User

```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL shell:
CREATE DATABASE clinic_db;
CREATE USER clinic_user WITH PASSWORD 'clinic_password';
GRANT ALL PRIVILEGES ON DATABASE clinic_db TO clinic_user;
\q
```

## Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL=postgresql://clinic_user:clinic_password@localhost:5432/clinic_db
# SECRET_KEY=your-secret-key-here (generate a random string)
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=480
# ENVIRONMENT=development
# CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Generate a secret key (optional, for production):
# python -c "import secrets; print(secrets.token_urlsafe(32))"

# Run database migrations
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# Initialize default users
python app/init_db.py

# Start the backend server
uvicorn app.main:app --reload
```

The backend API will be available at:
- API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

## Step 3: Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Step 4: First Login

Open your browser and go to `http://localhost:5173`

Use these default credentials:

- **Admin**: `admin` / `admin123`
- **Doctor**: `doctor` / `doctor123`
- **Reception**: `reception` / `reception123`

**⚠️ Important**: Change these passwords in production!

## Step 5: Test the Workflow

### Reception Workflow

1. Login as `reception`
2. Click "Register Patient"
3. Fill in patient details:
   - Name: Test Patient
   - Phone: 9876543210
   - Age: 30
   - Gender: Male
4. Click "Register & Continue to Vitals"
5. Enter vitals:
   - BP: 120/80
   - Temperature: 98.6
   - Weight: 70
6. Click "Save Vitals"
7. Patient is now in doctor queue

### Doctor Workflow

1. Login as `doctor`
2. Click "Patient Queue"
3. Select a patient from the queue
4. Fill consultation:
   - Select chief complaints (chips)
   - Enter diagnosis (optional)
   - Add medicines using the medicine entry form
   - Add advice (optional)
5. Click "Save & View Prescription"
6. Review prescription and click "Print Prescription"

## Troubleshooting

### Database Connection Error

```
Error: could not connect to server
```

**Solution:**
- Ensure PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Check DATABASE_URL in `.env` file
- Verify database and user exist

### Migration Errors

```
Error: Target database is not up to date
```

**Solution:**
```bash
# Check current migration status
alembic current

# If needed, upgrade to head
alembic upgrade head
```

### Port Already in Use

```
Error: Address already in use
```

**Solution:**
- Backend: Change port in `uvicorn app.main:app --reload --port 8001`
- Frontend: Change port in `vite.config.js` or use `npm run dev -- --port 5174`

### Module Not Found

```
ModuleNotFoundError: No module named 'app'
```

**Solution:**
- Ensure you're in the `backend` directory
- Virtual environment is activated
- Dependencies are installed: `pip install -r requirements.txt`

## Production Deployment

For production deployment on AWS Lightsail:

1. **Set up VM**
   - Create Ubuntu 22.04 LTS instance
   - Configure security groups (ports 80, 443, 22)

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install python3.9 python3-pip postgresql nginx
   ```

3. **Database Setup**
   - Create production database
   - Update DATABASE_URL in `.env`

4. **Backend Setup**
   - Clone repository
   - Set up virtual environment
   - Install dependencies
   - Run migrations
   - Use Gunicorn: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`

5. **Frontend Setup**
   - Build: `npm run build`
   - Serve with Nginx

6. **Nginx Configuration**
   - Reverse proxy for API
   - Serve static files
   - SSL with Let's Encrypt

## Next Steps

- Review `ARCHITECTURE.md` for system design
- Check `README.md` for feature overview
- Customize templates and common drugs list
- Set up backups for database
- Configure email/SMS notifications (Phase 3)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review API docs at `/docs` endpoint
3. Check logs in terminal/console
4. Verify database and environment variables
