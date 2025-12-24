#!/bin/bash

echo "🚀 Starting TRIAGELOCK with AI/ML Features..."
echo ""

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.9+"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start ML Service
echo "🤖 Starting ML Service..."
cd ml-service

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python -m venv venv
fi

source venv/bin/activate  # Linux/Mac
pip install -q -r requirements.txt

python app.py &
ML_PID=$!
echo "✅ ML Service started (PID: $ML_PID)"

cd ..

# Start Backend
echo "🔧 Starting Backend..."
npm run dev:backend &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Start Frontend
echo "🎨 Starting Frontend..."
npm run dev:client &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ TRIAGELOCK AI/ML System Running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Frontend:    http://localhost:5173"
echo "🔧 Backend:     http://localhost:3000"
echo "🤖 ML Service:  http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
trap "echo 'Stopping services...'; kill $ML_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
