# Quick Setup Guide for TriageLock

## First Time Setup

1. **Install all dependencies:**
   ```powershell
   npm run install:all
   ```

2. **Setup database:**
   ```powershell
   npm run migrate
   npm run seed
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env` in root directory
   - Copy `client/.env.example` to `client/.env`

## Starting the Application

### Option 1: Use the startup script (Recommended)
```powershell
.\start-dev.ps1
```

### Option 2: Manual start
```powershell
npm run dev
```

This runs both:
- Backend API on http://localhost:3000
- Frontend on http://localhost:5173

### Option 3: Separate terminals
```powershell
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:client
```

## Access the Application

Open your browser to: **http://localhost:5173**

### Default Login Credentials (after seeding)

- **Admin**: admin@hospital.com / changeme
- **Doctor**: doctor@hospital.com / password
- **Nurse**: nurse@hospital.com / password

## Testing the API

Test health endpoint:
```powershell
curl http://localhost:3000/health
```

## Common Issues

### Port Already in Use
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
# Note the PID and run:
Stop-Process -Id <PID> -Force

# Or use the startup script which handles this automatically
.\start-dev.ps1
```

### Database Issues
```powershell
# Reset database
Remove-Item triagelock.sqlite3
npm run migrate
npm run seed
```

### Module Not Found
```powershell
# Reinstall all dependencies
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client\node_modules
npm run install:all
```

## Features

### Real-time Updates
- WebSocket connection for live patient updates
- Automatic triage score calculation
- Load balancing recommendations

### Role-Based Access
- **Nurse View** (`/nurse`): Patient intake and triage
- **Doctor View** (`/doctor`): Patient queue and treatment
- **Admin Panel** (`/admin`): Hospital capacity management
- **Government View** (`/government`): Analytics and reporting

### API Integration
All frontend pages connect to the backend API:
- `/api/auth` - Authentication
- `/api/patients` - Patient management
- `/api/hospitals` - Hospital data
- `/api/analytics` - Statistics and reports

## Development Tips

1. **Hot Reload**: Both servers support hot reload - just save your files
2. **API Proxy**: Vite proxies `/api` requests to the backend automatically
3. **WebSocket**: Socket.IO connects through the Vite proxy
4. **Logs**: Backend logs are in the `logs/` directory

## Build for Production

```powershell
# Build everything
npm run build

# Start production server
npm start
```

The production server serves the built frontend from the backend.

## Project Structure

```
triagelock/
├── src/              # Backend source
├── client/           # Frontend source
│   ├── src/
│   │   ├── services/  # API & WebSocket services
│   │   ├── hooks/     # React hooks (auth, theme)
│   │   ├── pages/     # Route components
│   │   └── components/# Reusable UI components
├── dist/             # Backend build output
└── client/dist/      # Frontend build output
```

## Next Steps

1. Start the dev servers: `.\start-dev.ps1`
2. Open http://localhost:5173
3. Login with default credentials
4. Test the nurse view to create a patient
5. Check the doctor view to see the patient queue
6. View analytics in the admin panel

For more details, see:
- `README-FULLSTACK.md` - Complete documentation
- `API_DOCUMENTATION.md` - API reference
- `ARCHITECTURE.md` - System architecture
