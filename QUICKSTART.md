# TRIAGELOCK - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Redis 6+ installed and running

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Database

**Option A: Use existing PostgreSQL**
Edit `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=triagelock
DB_USER=postgres
DB_PASSWORD=your-password
```

**Option B: Create new database**
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE triagelock;
\q
```

### Step 3: Configure Redis

If Redis is running locally with default settings, no changes needed.

If Redis has a password:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Step 4: Run Migrations
```bash
npm run migrate
```

### Step 5: Seed Sample Data (Optional)
```bash
npm run seed
```

This creates:
- 3 sample hospitals
- 4 sample users (admin, doctor, government)
- Staff availability data

### Step 6: Start Development Server
```bash
npm run dev
```

Server will start on `http://localhost:3000`

---

## 🧪 Test the API

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cityhospital.com",
    "password": "admin123"
  }'
```

Copy the `token` from the response.

### 3. Register a Patient
```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "patientId": "PT-001",
    "name": "John Doe",
    "age": 55,
    "gender": "male",
    "triageInput": {
      "vitalSigns": {
        "heartRate": 130,
        "respiratoryRate": 28,
        "systolicBP": 170,
        "diastolicBP": 100,
        "temperature": 38.8,
        "oxygenSaturation": 89,
        "consciousness": "alert"
      },
      "symptoms": [
        {
          "symptom": "chest pain",
          "severity": "severe"
        }
      ],
      "riskFactors": [
        {
          "factor": "diabetes",
          "category": "chronic"
        }
      ]
    }
  }'
```

### 4. View Emergency Queue
```bash
curl -X GET "http://localhost:3000/api/patients/queue" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📊 Sample Credentials (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cityhospital.com | admin123 |
| Doctor | doctor@cityhospital.com | doctor123 |
| Government | government@health.gov | gov123 |

**⚠️ Change these immediately in production!**

---

## 🎯 Key Features to Test

### 1. Triage Engine
Register patients with different vital signs and see automatic priority assignment:
- **RED**: Critical (heart rate < 40 or > 140, oxygen < 90%)
- **YELLOW**: Urgent (abnormal vitals)
- **GREEN**: Standard (stable with concerns)
- **BLUE**: Minor (stable)

### 2. Auto-Escalation
Wait 15+ minutes and run:
```bash
curl -X POST "http://localhost:3000/api/patients/check-escalations?hospitalId=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Real-Time Queue
Connect via WebSocket (using frontend or tools like Postman/wscat):
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_TOKEN' }
});

socket.emit('join:hospital', 1);

socket.on('queue:update', (data) => {
  console.log('Queue updated:', data);
});
```

### 4. Hospital Stats
```bash
curl -X GET "http://localhost:3000/api/hospitals/1/stats" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Analytics Dashboard
```bash
curl -X POST "http://localhost:3000/api/analytics/reports/generate" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-12-22"}'
```

---

## 🔧 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Ensure PostgreSQL is running:
```bash
# Check status
sudo systemctl status postgresql  # Linux
pg_ctl status  # Windows

# Start if not running
sudo systemctl start postgresql  # Linux
pg_ctl start  # Windows
```

### Redis Connection Error
```
Error: Redis connection refused
```
**Solution**: Ensure Redis is running:
```bash
# Check status
sudo systemctl status redis  # Linux
redis-server  # Windows (in separate terminal)
```

### Migration Error
```
Error: relation "hospitals" already exists
```
**Solution**: Database already migrated. Skip this step or reset:
```bash
npm run migrate:rollback
npm run migrate
```

### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**: Change port in `.env`:
```env
PORT=3001
```

---

## 📚 Next Steps

1. Read [README.md](README.md) for full documentation
2. Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for all endpoints
3. Review [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
4. Customize triage thresholds in `.env`
5. Build a frontend dashboard to visualize the queue

---

## 🎬 Project Structure

```
src/
├── config/              # Database & Redis configuration
├── controllers/         # API request handlers
├── database/
│   ├── migrations/      # Database schema
│   └── seeds/           # Sample data
├── middleware/          # Auth, validation, errors
├── routes/              # API endpoints
├── services/            # Business logic
│   ├── triageEngine.ts        # 🔥 CORE TRIAGE ALGORITHM
│   ├── patientService.ts      # Patient management
│   ├── hospitalService.ts     # Hospital operations
│   ├── analyticsService.ts    # Reports & stats
│   └── schedulerService.ts    # Background jobs
├── utils/               # Helper functions
├── websocket/           # Real-time updates
└── server.ts            # Entry point
```

---

## 💡 Pro Tips

1. **Monitor Background Jobs**: Check logs for auto-escalations
   ```bash
   npm run dev
   # Watch for: "Auto-escalated X patients"
   ```

2. **Test Real-Time**: Open multiple browser tabs to see live updates

3. **Customize Thresholds**: Adjust wait times in `.env`:
   ```env
   CRITICAL_WAIT_TIME_MINUTES=10
   HIGH_WAIT_TIME_MINUTES=45
   MEDIUM_WAIT_TIME_MINUTES=90
   ```

4. **Clear Test Data**: 
   ```bash
   npm run migrate:rollback
   npm run migrate
   npm run seed
   ```

---

## 🏥 System Overview

**TRIAGELOCK** is a rule-based emergency triage system with:
- ✅ No AI/ML - Pure deterministic logic
- ✅ Real-time queue management
- ✅ Auto-escalation based on wait time & vitals
- ✅ Multi-hospital support
- ✅ Government oversight dashboard
- ✅ Exportable reports
- ✅ WebSocket real-time updates

**Built for emergencies. Designed for speed. Powered by logic.**

---

Need help? Check the logs in `logs/` directory or review the documentation files.
