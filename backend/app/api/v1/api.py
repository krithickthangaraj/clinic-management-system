from fastapi import APIRouter
from app.api.v1.endpoints import auth, patients, visits, vitals, prescriptions, tests, templates, master, patient_history, visit_relations

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(visits.router, prefix="/visits", tags=["visits"])
api_router.include_router(vitals.router, prefix="/vitals", tags=["vitals"])
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["prescriptions"])
api_router.include_router(tests.router, prefix="/tests", tags=["tests"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(master.router, prefix="/master", tags=["master"])
api_router.include_router(patient_history.router, prefix="/patient-history", tags=["patient-history"])
api_router.include_router(visit_relations.router, prefix="/visit-relations", tags=["visit-relations"])
