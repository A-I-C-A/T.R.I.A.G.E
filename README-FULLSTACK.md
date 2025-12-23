# TriageLock - Integrated Full-Stack Application

Emergency Triage & Load Management System with React frontend and Node.js backend.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install all dependencies** (root + client):
```bash
npm run install:all
```

### Development

Run both backend and frontend concurrently:
```bash
npm run dev
```

This will start:
- Backend API: `http://localhost:3000`
- Frontend: `http://localhost:5173`

Or run them separately:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:client
```

### Database Setup

```bash
# Run migrations
npm run migrate

# Seed database (optional)
npm run seed
```

## 📁 Project Structure

```
triagelock/
├── src/                    # Backend (Node.js/Express)
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── websocket/
│   └── server.ts
├── client/                 # Frontend (React/Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── package.json           # Root package.json
└── README-FULLSTACK.md
```

## 🔧 Configuration

### Backend (.env in root)
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_NAME=triagelock
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
```

### Frontend (client/.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

## 🏗️ Build for Production

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

The backend will serve the built frontend files in production mode.

## 🧪 Testing

```bash
npm test
```

## 📚 API Documentation

See `API_DOCUMENTATION.md` for detailed API endpoints.

## 🎨 Frontend Features

- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Socket.IO Client** for real-time updates
- **Axios** for API calls
- **React Router** for navigation

## 🔌 Backend Features

- **Express.js** REST API
- **Socket.IO** for WebSocket connections
- **JWT** authentication
- **Knex.js** for database migrations
- **SQLite/PostgreSQL** support
- **Winston** logging

## 🔑 Default Users (after seeding)

- **Admin**: admin@hospital.com / changeme
- **Doctor**: doctor@hospital.com / password
- **Nurse**: nurse@hospital.com / password

## 📖 Role-Based Views

- `/nurse` - Patient intake and triage
- `/doctor` - Patient queue and treatment
- `/admin` - Hospital management
- `/government` - Analytics and reporting

## 🌐 WebSocket Events

### Client → Server
- `join-room` - Join hospital room
- `patient-update` - Update patient status

### Server → Client
- `patient-created` - New patient added
- `patient-updated` - Patient status changed
- `triage-alert` - Critical patient alert

## 🛠️ Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **CORS**: Configured for localhost:5173 ↔ localhost:3000
3. **Proxy**: Vite proxies /api and /socket.io to backend
4. **Types**: Shared types can be placed in `client/src/types/`

## 📦 Scripts Reference

- `npm run dev` - Run full stack in development
- `npm run dev:backend` - Backend only
- `npm run dev:client` - Frontend only
- `npm run build` - Build both for production
- `npm run build:backend` - Build backend only
- `npm run build:client` - Build frontend only
- `npm start` - Run production build
- `npm run install:all` - Install all dependencies

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 3000 (backend)
npx kill-port 3000

# Kill process on port 5173 (frontend)
npx kill-port 5173
```

### Database issues
```bash
# Reset database
rm triagelock.sqlite3
npm run migrate
npm run seed
```

### Frontend build errors
```bash
cd client
rm -rf node_modules
npm install
npm run build
```

## 📄 License

MIT
