#!/bin/bash

# Clinic Management System - Frontend Startup Script

cd "$(dirname "$0")"

echo "🚀 Starting Clinic Management Frontend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Start development server
echo "🌟 Starting Vite development server..."
echo "   Frontend will be available at: http://localhost:5173"
echo ""
npm run dev
