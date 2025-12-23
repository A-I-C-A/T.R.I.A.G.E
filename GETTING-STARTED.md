# 🏥 TriageLock - Getting Started

## Frontend-Backend Integration Complete! ✅

Your TriageLock application is now a fully integrated full-stack system with React frontend and Node.js backend.

---

## 🚀 Quick Start (3 Commands)

```powershell
# 1. Install all dependencies
npm run install:all

# 2. Setup database (if not done)
npm run migrate

# 3. Start the app
.\start-dev.ps1
```

Then open: **http://localhost:5173**

---

## 📁 What You Have Now

### Backend (Port 3000)
- ✅ Express REST API
- ✅ WebSocket server (Socket.IO)
- ✅ JWT authentication
- ✅ SQLite database
- ✅ Real-time triage engine

### Frontend (Port 5173)
- ✅ React 18 + TypeScript
- ✅ Vite build system
- ✅ TailwindCSS styling
- ✅ API integration layer
- ✅ WebSocket client
- ✅ Authentication context

### Integration
- ✅ API proxy configured
- ✅ WebSocket connection
- ✅ Shared TypeScript types
- ✅ Hot reload on both sides
- ✅ Production build pipeline

---

## 🎯 How It Works

```
USER LOGS IN
  ↓
Frontend (React) → API Request → Backend (Express)
  ↓                                ↓
JWT Token ←-------- Response ------┘
  ↓
Stored in localStorage
  ↓
API Interceptor adds token to all requests
  ↓
WebSocket connects with token
  ↓
Real-time updates across all clients
```

---

## 🔌 API Integration Example

**Before (mock data):**
```typescript
const patients = MOCK_PATIENTS;
```

**After (real API):**
```typescript
import { patientAPI } from '@/services/api';

const { data } = await patientAPI.getPatients();
const patients = data.patients;
```

**With WebSocket:**
```typescript
import { wsService } from '@/services/websocket';

wsService.on('patient-created', (patient) => {
  setPatients(prev => [...prev, patient]);
});
```

---

## 📂 Key Files Created

### API Services
- `client/src/services/api.ts` - REST API client
- `client/src/services/websocket.ts` - WebSocket client

### React Hooks
- `client/src/hooks/use-auth.tsx` - Authentication
- `client/src/hooks/use-theme.tsx` - Theme switching

### Configuration
- `client/vite.config.ts` - Vite + proxy setup
- `client/tailwind.config.js` - Tailwind CSS
- `client/tsconfig.json` - TypeScript config

### Utilities
- `client/src/lib/utils.ts` - Helper functions
- `client/src/types/index.ts` - Type definitions

---

## 🛠️ Development Workflow

### Start Development Servers
```powershell
.\start-dev.ps1
```
Runs both backend (3000) and frontend (5173) with hot reload.

### Run Backend Only
```powershell
npm run dev:backend
```

### Run Frontend Only
```powershell
npm run dev:client
```

### Build for Production
```powershell
npm run build
npm start
```
Frontend served from backend on port 3000.

---

## 🔐 Authentication Flow

1. User fills login form
2. Frontend calls `authAPI.login(email, password)`
3. Backend validates credentials
4. Returns JWT token
5. Token stored in localStorage
6. Axios interceptor adds token to requests
7. WebSocket connects with token
8. User redirected to role-based view

---

## 📱 Frontend Pages

Each page connects to real backend:

| Route | Component | Connects To |
|-------|-----------|-------------|
| `/` | Landing | - |
| `/auth/nurse` | NurseAuth | `POST /api/auth/login` |
| `/nurse` | NurseView | `POST /api/patients`, WebSocket |
| `/doctor` | DoctorView | `GET /api/patients`, WebSocket |
| `/admin` | AdminPanel | `GET /api/analytics` |
| `/government` | GovernmentView | `GET /api/analytics` |

---

## 🌐 API Endpoints Available

### Authentication
```typescript
authAPI.login(email, password)
authAPI.register(data)
authAPI.getCurrentUser()
```

### Patients
```typescript
patientAPI.createPatient(data)
patientAPI.getPatients(filters)
patientAPI.getPatient(id)
patientAPI.updatePatient(id, data)
patientAPI.triagePatient(id)
patientAPI.assignDoctor(id, doctorId)
```

### Hospitals
```typescript
hospitalAPI.getHospitals()
hospitalAPI.getHospital(id)
hospitalAPI.updateCapacity(id, data)
```

### Analytics
```typescript
analyticsAPI.getOverview(hospitalId)
analyticsAPI.getTriageStats(filters)
analyticsAPI.getWaitTimes(hospitalId)
```

---

## 🔄 WebSocket Events

### Listen to events:
```typescript
wsService.on('patient-created', handleNewPatient)
wsService.on('patient-updated', handleUpdate)
wsService.on('triage-alert', handleCritical)
```

### Emit events:
```typescript
wsService.emit('join-room', { room: 'hospital-1' })
wsService.joinRoom('hospital-1')
```

---

## 🎨 UI Components

All components from `ui-files` are now in `client/src/components/`:
- Badge, Button, Card, Dialog
- Input, Select, Tabs, Table
- And 40+ more Radix UI components

---

## ⚙️ Environment Variables

### Backend (.env)
```env
PORT=3000
JWT_SECRET=your-secret-key
DB_NAME=triagelock
CLIENT_URL=http://localhost:5173
```

### Frontend (client/.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## 🐛 Troubleshooting

### Port in use
```powershell
# Automatic: Use start script
.\start-dev.ps1

# Manual: Kill process
netstat -ano | findstr :3000
Stop-Process -Id <PID> -Force
```

### Dependencies issues
```powershell
npm run install:all
```

### Database issues
```powershell
Remove-Item triagelock.sqlite3
npm run migrate
npm run seed
```

### Build errors
```powershell
# Clean and rebuild
Remove-Item -Recurse dist, client\dist -ErrorAction SilentlyContinue
npm run build
```

---

## 📖 Documentation

- `README-FULLSTACK.md` - Complete guide
- `SETUP-GUIDE.md` - Setup instructions
- `INTEGRATION-SUMMARY.md` - What was integrated
- `API_DOCUMENTATION.md` - API reference
- `ARCHITECTURE.md` - System architecture

---

## ✅ Checklist

Before you start developing:

- [x] Dependencies installed (`npm run install:all`)
- [x] Database migrated (`npm run migrate`)
- [x] Environment files configured
- [x] Can start dev servers (`.\start-dev.ps1`)
- [ ] Tested login flow
- [ ] Created a test patient
- [ ] Verified WebSocket connection
- [ ] Reviewed API documentation

---

## 🎉 You're Ready!

Your full-stack TriageLock application is ready for development!

**Start developing:**
```powershell
.\start-dev.ps1
```

**Then open:** http://localhost:5173

**Login with:** nurse@hospital.com / password

Happy coding! 🚀
