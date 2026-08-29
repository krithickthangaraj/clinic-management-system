from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import warnings
import logging

# Suppress bcrypt warnings (AttributeError is trapped, so we suppress all warnings from passlib)
warnings.filterwarnings('ignore', module='passlib')
logging.getLogger('passlib').setLevel(logging.ERROR)

from app.core.config import settings
from app.core.database import Base, engine
import app.models  # Ensure all models are registered with Base
from app.api.v1.api import api_router

app = FastAPI(
    title="Clinic Management System",
    description="Fast, simple, doctor-friendly patient management",
    version="1.0.0"
)

# CORS middleware
origins = settings.cors_origins_list
# In development allow all origins to simplify local testing
if settings.ENVIRONMENT == 'development':
    origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# startup handler
@app.on_event('startup')
async def _startup():
    print(f"Starting Clinic API (env={settings.ENVIRONMENT}), CORS origins={origins}")
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning during DB table auto-creation: {e}")

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Clinic Management System API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
