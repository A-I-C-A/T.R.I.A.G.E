@echo off
echo ============================================
echo  Starting TRIAGELOCK AI/ML System
echo ============================================
echo.

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python 3.9+ from https://python.org
    pause
    exit /b 1
)

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Prerequisites check passed
echo.

REM Start ML Service
echo [1/3] Starting ML Service...
cd ml-service

if not exist "venv\" (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -q -r requirements.txt
start /B python app.py

cd ..
timeout /t 3 /nobreak >nul

echo [OK] ML Service started on http://localhost:5001
echo.

REM Start Backend
echo [2/3] Starting Backend Server...
start /B npm run dev:backend
timeout /t 3 /nobreak >nul
echo [OK] Backend started on http://localhost:3000
echo.

REM Start Frontend
echo [3/3] Starting Frontend...
start /B npm run dev:client
timeout /t 3 /nobreak >nul
echo [OK] Frontend started on http://localhost:5173
echo.

echo ============================================
echo  TRIAGELOCK AI/ML System Running!
echo ============================================
echo.
echo  Frontend:    http://localhost:5173
echo  Backend:     http://localhost:3000
echo  ML Service:  http://localhost:5001
echo.
echo  Press any key to stop all services...
echo ============================================

pause >nul

echo.
echo Stopping services...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1

echo All services stopped.
pause
