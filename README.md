# Clinic Management System

A fast, simple, and doctor-friendly Patient Management System for small clinics.

## 🎯 Design Philosophy

**Speed over complexity. Templates over typing. Mobile-first UX.**

The system prioritizes:
- ⚡ Fast data entry (minimal typing)
- 📱 Mobile-first responsive design
- 🎨 Clean, uncluttered interface
- 🔄 Template-based workflows
- ⏱️ Doctor time optimization

## 🏗️ Architecture

### Tech Stack

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- PostgreSQL
- Alembic migrations
- JWT authentication

**Frontend:**
- React (Vite)
- PWA support
- Responsive UI (Mobile/Tablet/Desktop)

**Deployment (Future):**
- AWS Lightsail (single VM)

### Project Structure

```
clinic-software/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── api/         # API routes
│   │   ├── core/        # Config, security, dependencies
│   │   └── services/    # Business logic
│   ├── alembic/         # Database migrations
│   └── requirements.txt
│
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API clients
│   │   ├── hooks/       # Custom hooks
│   │   └── utils/       # Utilities
│   └── package.json
│
└── README.md
```

## 👥 User Roles

1. **Reception/Attender** - Patient registration, vitals entry
2. **Doctor** - Consultation, prescription, templates
3. **Lab/Test Staff** - Test results entry
4. **Admin** - System management (minimal)

## 🔄 Core Workflows

### 1. Patient Registration (Reception)
- Fast entry: Name, Phone, Age, Gender
- Auto-creates visit entry
- Assigns visit number
- Patient enters doctor queue

### 2. Vitals Entry (Reception)
- Quick entry: BP, Temperature, Weight, Sugar
- Large input fields
- Numeric keypad on mobile
- Single screen, one-click save

### 3. Doctor Consultation
- **Chief Complaints**: Multi-select chips (Fever, Cold, Cough, etc.)
- **Diagnosis**: Optional, short text or dropdown
- **Medicines**: 
  - Drug name (autocomplete)
  - Dosage (dropdown)
  - Frequency (1-0-1, 1-1-1, etc.)
  - Auto-calculated dates and quantities
- **Advice**: Template-based
- **Follow-up**: Date picker
- **Prescription**: Print-ready PDF

### 4. Templates
- Doctor creates templates for common diseases
- One-click application with auto-fill
- Minor edits → save

### 5. Lab Tests
- Doctor orders tests
- Lab staff enters results
- Doctor views results in patient history

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials:
# DATABASE_URL=postgresql://username:password@localhost:5432/clinic_db
# SECRET_KEY=your-secret-key-here

# Create database (in PostgreSQL)
# psql -U postgres
# CREATE DATABASE clinic_db;
# CREATE USER clinic_user WITH PASSWORD 'clinic_password';
# GRANT ALL PRIVILEGES ON DATABASE clinic_db TO clinic_user;

# Run migrations
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# Initialize default users
python app/init_db.py

# Start server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Default Login Credentials

After running `init_db.py`:

- **Admin**: `admin` / `admin123`
- **Doctor**: `doctor` / `doctor123`
- **Reception**: `reception` / `reception123`

## 📋 Development Phases

### Phase 1 (MVP) ✅
- [x] Patient registration
- [x] Vitals entry
- [x] Doctor consultation
- [x] Prescription printing

### Phase 2 (Next)
- [ ] Templates system
- [ ] Lab tests workflow
- [ ] Reports

### Phase 3 (Future)
- [ ] Analytics dashboard
- [ ] Patient history
- [ ] Backup & export

## 🔒 Security

- JWT-based authentication
- Role-based access control
- Protected doctor data
- No accidental deletions

## 📱 Mobile Optimization

- Large touch targets
- Numeric keypads for inputs
- Single-screen workflows
- Offline-capable PWA

## 🎨 UX Principles

1. **One screen = one task**
2. **Large buttons, simple language**
3. **Defaults auto-fill everywhere**
4. **Templates reduce typing by 80%**
5. **Mobile-first, desktop-enhanced**

---

**Goal**: Make clinic management as easy as WhatsApp, not heavy hospital software.
