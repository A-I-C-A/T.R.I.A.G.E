# TriageLock Full-Stack Startup Script
Write-Host "🏥 Starting TriageLock Full-Stack Application..." -ForegroundColor Cyan

# Check if dependencies are installed
if (-not (Test-Path ".\node_modules")) {
    Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path ".\client\node_modules")) {
    Write-Host "📦 Installing client dependencies..." -ForegroundColor Yellow
    cd client
    npm install
    cd ..
}

# Check if database exists
if (-not (Test-Path ".\triagelock.sqlite3")) {
    Write-Host "🗄️  Creating database..." -ForegroundColor Yellow
    npm run migrate
}

# Kill any processes on ports 3000 and 5173
Write-Host "🔍 Checking for processes on ports 3000 and 5173..." -ForegroundColor Yellow

$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($port3000) {
    Write-Host "⚠️  Port 3000 is in use by PID $port3000. Stopping..." -ForegroundColor Red
    Stop-Process -Id $port3000 -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($port5173) {
    Write-Host "⚠️  Port 5173 is in use by PID $port5173. Stopping..." -ForegroundColor Red
    Stop-Process -Id $port5173 -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "`n✅ Starting development servers..." -ForegroundColor Green
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop all servers`n" -ForegroundColor Yellow

npm run dev
