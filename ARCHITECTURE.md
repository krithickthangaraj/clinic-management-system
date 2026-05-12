# Architecture Documentation

## System Overview

The Clinic Management System is built with a clear separation between backend (FastAPI) and frontend (React), designed for speed, simplicity, and mobile-first UX.

## Backend Architecture

### Technology Stack
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL
- **Migrations**: Alembic
- **Authentication**: JWT (JSON Web Tokens)

### Project Structure

```
backend/
├── app/
│   ├── models/          # SQLAlchemy database models
│   │   ├── user.py
│   │   ├── patient.py
│   │   ├── visit.py
│   │   ├── vitals.py
│   │   ├── prescription.py
│   │   ├── test.py
│   │   └── template.py
│   ├── schemas/         # Pydantic request/response schemas
│   ├── api/             # API routes
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py
│   │       │   ├── patients.py
│   │       │   ├── visits.py
│   │       │   ├── vitals.py
│   │       │   ├── prescriptions.py
│   │       │   └── tests.py
│   │       └── api.py
│   ├── core/            # Core configuration
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── dependencies.py
│   ├── services/        # Business logic
│   │   └── patient_service.py
│   └── main.py          # FastAPI app entry point
├── alembic/             # Database migrations
└── requirements.txt
```

### Database Schema

#### Core Entities

1. **User** - System users (reception, doctor, lab, admin)
2. **Patient** - Patient information
3. **Visit** - Each patient visit
4. **Vitals** - Vital signs for a visit
5. **Prescription** - Prescription header
6. **PrescriptionDrug** - Individual medicines in prescription
7. **Test** - Lab tests ordered
8. **Template** - Doctor templates for common conditions

#### Relationships

```
Patient 1───* Visit
Visit 1───1 Vitals
Visit 1───1 Prescription
Prescription 1───* PrescriptionDrug
Visit 1───* Test
User 1───* Visit (as doctor)
User 1───* Template
```

### API Design

#### Authentication
- POST `/api/v1/auth/login` - Login and get JWT token
- GET `/api/v1/auth/me` - Get current user info

#### Patients
- POST `/api/v1/patients/register` - Register patient + create visit
- GET `/api/v1/patients` - List patients (with search)
- GET `/api/v1/patients/{id}` - Get patient details

#### Visits
- GET `/api/v1/visits` - List visits (with status filter)
- GET `/api/v1/visits/queue` - Get doctor queue
- GET `/api/v1/visits/{id}` - Get visit details
- PATCH `/api/v1/visits/{id}` - Update visit (consultation data)

#### Vitals
- POST `/api/v1/vitals` - Create/update vitals
- GET `/api/v1/vitals/visit/{visit_id}` - Get vitals for visit

#### Prescriptions
- POST `/api/v1/prescriptions` - Create prescription
- GET `/api/v1/prescriptions/visit/{visit_id}` - Get prescription
- POST `/api/v1/prescriptions/{id}/print` - Mark as printed

#### Tests
- POST `/api/v1/tests` - Order test
- GET `/api/v1/tests/visit/{visit_id}` - Get tests for visit
- GET `/api/v1/tests/pending` - Get pending tests (lab)
- PATCH `/api/v1/tests/{id}` - Update test results

### Security

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Protected routes with role checks

## Frontend Architecture

### Technology Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **PWA**: Vite PWA Plugin
- **Printing**: react-to-print

### Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   │   ├── ProtectedRoute.jsx
│   │   ├── MedicineEntry.jsx
│   │   └── PrescriptionView.jsx
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── reception/
│   │   │   ├── PatientRegistration.jsx
│   │   │   └── VitalsEntry.jsx
│   │   └── doctor/
│   │       ├── DoctorQueue.jsx
│   │       └── Consultation.jsx
│   ├── services/        # API clients
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── patientService.js
│   │   ├── visitService.js
│   │   ├── vitalsService.js
│   │   └── prescriptionService.js
│   ├── contexts/        # React contexts
│   │   └── AuthContext.jsx
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── index.html
└── vite.config.js
```

### Key UX Patterns

#### 1. Mobile-First Design
- Large touch targets (min 44px)
- Numeric keypads for number inputs
- Single-screen workflows
- Responsive grid layouts

#### 2. Minimal Typing
- Autocomplete for drug names
- Dropdowns for dosages and frequencies
- Chip-based selection for complaints
- Auto-calculated fields (dates, quantities)

#### 3. Fast Data Entry
- Default values everywhere
- One-click actions
- Inline editing
- Quick save buttons

#### 4. Clear Visual Hierarchy
- Large, readable fonts
- High contrast
- Clear button labels
- Minimal clutter

## Workflow Design

### Reception Workflow

1. **Patient Registration**
   - Enter: Name, Phone, Age, Gender
   - Auto-creates visit
   - Redirects to vitals entry

2. **Vitals Entry**
   - Large number inputs
   - Numeric keypad on mobile
   - Quick save
   - Patient enters doctor queue

### Doctor Workflow

1. **View Queue**
   - See patients with vitals done
   - Click to start consultation

2. **Consultation**
   - View vitals summary
   - Select chief complaints (chips)
   - Enter diagnosis (optional)
   - Add medicines (fast entry component)
   - Add advice (optional)
   - Set follow-up (optional)
   - Save & view prescription

3. **Prescription**
   - Clean, printable format
   - One-click print
   - Auto-marked as printed

## Performance Considerations

### Backend
- Database indexes on frequently queried fields
- Efficient queries with SQLAlchemy
- Connection pooling
- JWT token caching

### Frontend
- Code splitting with Vite
- Lazy loading routes
- Optimized re-renders
- PWA for offline capability

## Security Considerations

1. **Authentication**
   - JWT tokens with expiration
   - Secure password hashing
   - Token refresh mechanism

2. **Authorization**
   - Role-based access control
   - Route protection
   - API endpoint protection

3. **Data Protection**
   - No sensitive data in URLs
   - Secure API communication
   - Input validation

## Scalability

### Current Design
- Single server deployment
- PostgreSQL database
- Stateless API

### Future Enhancements
- Database read replicas
- Redis caching
- CDN for static assets
- Load balancing
- Microservices (if needed)

## Deployment

### Development
- Backend: `uvicorn app.main:app --reload`
- Frontend: `npm run dev`

### Production (AWS Lightsail)
- Single VM with:
  - PostgreSQL
  - FastAPI (Gunicorn + Uvicorn)
  - Nginx reverse proxy
  - React build (static files)

## Future Enhancements

### Phase 2
- Template system for doctors
- Lab test workflow
- Basic reports

### Phase 3
- Analytics dashboard
- Patient history view
- Backup & export
- SMS notifications
- Email reports
