#!/bin/bash

# Clinic Management System - Backend Startup Script

cd "$(dirname "$0")"

echo "🚀 Starting Clinic Management Backend..."

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Check if packages are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your database credentials!"
fi

# Check database connection (optional)
echo "🔍 Checking database connection..."
python -c "
from app.core.config import settings
from sqlalchemy import create_engine, text
try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    print('✅ Database connection successful')
except Exception as e:
    print(f'⚠️  Database connection failed: {e}')
    print('   Make sure PostgreSQL is running and .env is configured')
"

# Run migrations
echo "🔄 Running database migrations..."
alembic upgrade head

# Start server
echo "🌟 Starting FastAPI server..."
echo "   API will be available at: http://localhost:8000"
echo "   API docs at: http://localhost:8000/docs"
echo ""
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
