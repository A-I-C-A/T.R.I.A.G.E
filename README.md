# TRIAGELOCK Backend

## Rule-Based Emergency Triage & Load Management System

A real-time, deterministic triage system for hospitals. **No AI. No ML. Pure logic.**

---

## Features

### 1. Rule-Based Digital Triage Engine
- Clinical priority calculation based on vital signs, symptoms, and risk factors
- WHO-compliant emergency protocols
- Four-tier priority system: RED (Critical), YELLOW (Urgent), GREEN (Standard), BLUE (Minor)

### 2. Live Emergency Queue Dashboard
- Real-time WebSocket updates
- Automatic priority escalation based on waiting time
- Color-coded urgency visualization

### 3. Hospital Load Awareness
- Bed availability tracking (General + ICU)
- Staff availability monitoring
- Real-time capacity management

### 4. Automatic Escalation Rules
- Time-based priority upgrades
- Vital signs deterioration monitoring
- Deterministic rule engine (no predictions)

### 5. Admin / Government View
- Crowd surge monitoring
- Multi-hospital dashboard
- Exportable incident reports
- Peak load analytics

---

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Real-time**: Socket.IO (WebSocket)
- **Database**: PostgreSQL with Knex.js
- **Cache**: Redis
- **Authentication**: JWT with bcrypt

---

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` with your database and Redis credentials.

3. **Run migrations**
```bash
npm run migrate
```

4. **Seed database** (optional - creates sample hospitals and users)
```bash
npm run seed
```

5. **Start development server**
```bash
npm run dev
```

6. **Build for production**
```bash
npm run build
npm start
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile (authenticated)

### Patients
- `POST /api/patients` - Register patient with triage
- `GET /api/patients/queue` - Get emergency queue
- `PUT /api/patients/:id/vitals` - Update vital signs
- `PUT /api/patients/:id/status` - Update patient status
- `POST /api/patients/check-escalations` - Check for auto-escalations

### Hospitals
- `GET /api/hospitals` - List all hospitals
- `POST /api/hospitals` - Create hospital (admin/government)
- `GET /api/hospitals/:id/stats` - Get hospital statistics
- `PUT /api/hospitals/:id/beds` - Update bed availability
- `PUT /api/hospitals/:id/staff` - Update staff availability
- `GET /api/hospitals/:id/overload` - Check overload status
- `GET /api/hospitals/:id/alerts` - Get active alerts
- `PUT /api/hospitals/alerts/:id/acknowledge` - Acknowledge alert

### Analytics
- `POST /api/analytics/reports/generate` - Generate daily report
- `GET /api/analytics/reports` - Get incident reports
- `GET /api/analytics/government/dashboard` - Government dashboard (government only)
- `GET /api/analytics/crowd-surge` - Crowd surge monitoring

---

## WebSocket Events

### Client → Server
- `join:hospital` - Join hospital room for updates
- `join:government` - Join government dashboard

### Server → Client
- `queue:update` - Queue updated
- `patient:registered` - New patient registered
- `patient:escalated` - Patient priority escalated
- `patient:status` - Patient status changed
- `alert:new` - New alert created
- `alert:critical` - Critical alert (also sent to government)
- `hospital:stats` - Hospital statistics updated
- `crowd:surge` - Crowd surge detected (government only)

---

## Background Jobs

Automated tasks run via `node-cron`:

- **Every 5 minutes**: Check patient escalations
- **Every 10 minutes**: Update waiting times
- **Every 15 minutes**: Check hospital overload
- **Daily at 1:00 AM**: Generate incident reports
- **Every 5 minutes**: Monitor crowd surges

---

## Triage Algorithm

### Priority Calculation

**RED (Critical)** - Score ≥ 80
- Unresponsive
- Heart rate < 40 or > 140
- Respiratory rate < 8 or > 30
- Oxygen saturation < 90%
- Critical symptoms (chest pain, severe bleeding, stroke)

**YELLOW (Urgent)** - Score ≥ 50
- Responds to pain only
- Abnormal vitals
- Urgent symptoms (moderate bleeding, severe pain)

**GREEN (Standard)** - Score ≥ 20
- Alert but with concerning symptoms
- Stable vitals with moderate issues

**BLUE (Minor)** - Score < 20
- Alert and stable
- Minor complaints

### Auto-Escalation Rules

1. **Time-based**:
   - RED: Never (immediate treatment)
   - YELLOW → RED: After 15 minutes
   - GREEN → YELLOW: After 60 minutes
   - BLUE → GREEN: After 120 minutes

2. **Vital signs deterioration**:
   - Critical vitals → RED
   - Abnormal vitals → YELLOW

---

## Default Credentials (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cityhospital.com | admin123 |
| Doctor | doctor@cityhospital.com | doctor123 |
| Government | government@health.gov | gov123 |

**⚠️ Change these in production!**

---

## Database Schema

### Core Tables
- `hospitals` - Hospital information
- `users` - System users
- `patients` - Patient records
- `vital_signs` - Vital signs history
- `symptoms` - Patient symptoms
- `risk_factors` - Risk factors
- `triage_history` - Priority change history
- `staff_availability` - Staff tracking
- `alerts` - System alerts
- `incident_reports` - Daily analytics

---

## Project Structure

```
src/
├── config/          # Database and Redis config
├── controllers/     # Request handlers
├── database/
│   ├── migrations/  # Database schema
│   └── seeds/       # Sample data
├── middleware/      # Auth, validation, error handling
├── models/          # (Reserved for future models)
├── routes/          # API routes
├── services/        # Business logic
│   ├── triageEngine.ts      # Core triage algorithm
│   ├── patientService.ts    # Patient management
│   ├── hospitalService.ts   # Hospital management
│   ├── analyticsService.ts  # Reports & analytics
│   └── schedulerService.ts  # Background jobs
├── utils/           # Helpers
├── websocket/       # Real-time handlers
└── server.ts        # Entry point
```

---

## Deployment

### Production Checklist
- [ ] Change `JWT_SECRET` in `.env`
- [ ] Update default passwords
- [ ] Configure PostgreSQL connection pooling
- [ ] Set up Redis persistence
- [ ] Enable HTTPS
- [ ] Configure CORS origins
- [ ] Set up log rotation
- [ ] Configure firewall rules
- [ ] Set up monitoring (e.g., PM2)

### Using PM2
```bash
npm install -g pm2
npm run build
pm2 start dist/server.js --name triagelock
pm2 save
pm2 startup
```

---

## License

MIT

---

## Support

For issues or questions, please refer to the system administrator.

**Built for emergencies. Designed for speed. Powered by logic.**
