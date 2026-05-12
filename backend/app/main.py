from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import warnings
import logging

# Suppress bcrypt warnings (AttributeError is trapped, so we suppress all warnings from passlib)
warnings.filterwarnings('ignore', module='passlib')
logging.getLogger('passlib').setLevel(logging.ERROR)

from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title="Clinic Management System",
    description="Fast, simple, doctor-friendly patient management",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Clinic Management System API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
