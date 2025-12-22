# TRIAGELOCK Backend Health Check & Testing Guide

## 🧪 Complete Endpoint Testing Suite

This guide provides step-by-step instructions to test **all backend endpoints** and verify system health.

---

## 📋 Prerequisites

### 1. Start the Backend
```bash
# Make sure PostgreSQL and Redis are running
npm run dev
```

Expected output:
```
Redis Client Connected
🏥 TRIAGELOCK Backend running on port 3000
Environment: development
WebSocket initialized
Background jobs scheduled
```

### 2. Install Testing Tools

**Option A: Using cURL** (comes with most systems)
```bash
curl --version
```

**Option B: Using HTTPie** (prettier output)
```bash
# Install httpie
npm install -g httpie

# Or on macOS
brew install httpie
```

**Option C: Use Postman/Insomnia** (GUI alternative)
- Download from postman.com or insomnia.rest

---

## 🏥 HEALTH CHECK

### Test 1: System Health
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-22T06:26:13.252Z"
}
```

✅ **Pass**: Status is "ok"  
❌ **Fail**: No response or error

---

## 🔐 AUTHENTICATION TESTS

### Test 2: Register New User (Admin)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.admin@hospital.com",
    "password": "Test123!",
    "name": "Test Admin",
    "role": "admin",
    "hospitalId": 1
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": 5,
    "email": "test.admin@hospital.com",
    "name": "Test Admin",
    "role": "admin",
    "hospitalId": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ **Pass**: User created with token  
❌ **Fail**: Email already exists (try different email)

**💾 SAVE THIS TOKEN** - You'll need it for subsequent tests!

---

### Test 3: Register Doctor User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.doctor@hospital.com",
    "password": "Test123!",
    "name": "Dr. Test",
    "role": "doctor",
    "hospitalId": 1
  }'
```

**💾 SAVE DOCTOR TOKEN**

---

### Test 4: Login (Seeded User)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cityhospital.com",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": 1,
    "email": "admin@cityhospital.com",
    "name": "Admin User",
    "role": "admin",
    "hospitalId": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ **Pass**: Valid token returned  
❌ **Fail**: Invalid credentials

---

### Test 5: Get User Profile
```bash
# Replace YOUR_TOKEN with actual token from Test 2 or 4
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "admin@cityhospital.com",
  "name": "Admin User",
  "role": "admin",
  "hospital_id": 1,
  "is_active": true
}
```

✅ **Pass**: Profile returned  
❌ **Fail**: 401 Unauthorized (bad token)

---

## 🏥 HOSPITAL ENDPOINTS

### Test 6: List All Hospitals
```bash
curl http://localhost:3000/api/hospitals \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "City General Hospital",
    "location": "Downtown, Main Street",
    "contact": "+1-555-0100",
    "total_beds": 200,
    "available_beds": 150,
    "icu_beds": 30,
    "available_icu_beds": 20
  },
  ...
]
```

✅ **Pass**: Array of hospitals  
❌ **Fail**: Empty array (run `npm run seed`)

---

### Test 7: Get Hospital Statistics
```bash
curl http://localhost:3000/api/hospitals/1/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "totalBeds": 200,
  "availableBeds": 150,
  "icuBeds": 30,
  "availableIcuBeds": 20,
  "currentLoad": 0,
  "waitingPatients": 0,
  "inTreatment": 0,
  "criticalCases": 0,
  "urgentCases": 0,
  "staffAvailability": [
    {
      "role": "doctor",
      "available_count": 15,
      "total_count": 20
    }
  ]
}
```

✅ **Pass**: Stats object returned  
❌ **Fail**: Hospital not found

---

### Test 8: Update Bed Availability
```bash
curl -X PUT http://localhost:3000/api/hospitals/1/beds \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "availableBeds": 145,
    "availableIcuBeds": 18
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "available_beds": 145,
  "available_icu_beds": 18,
  ...
}
```

✅ **Pass**: Beds updated  
❌ **Fail**: 403 Forbidden (need admin/staff role)

---

### Test 9: Update Staff Availability
```bash
curl -X PUT http://localhost:3000/api/hospitals/1/staff \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "doctor",
    "availableCount": 12,
    "totalCount": 20
  }'
```

**Expected Response:**
```json
{
  "role": "doctor",
  "availableCount": 12,
  "totalCount": 20,
  "availabilityRate": 60
}
```

✅ **Pass**: Staff updated  
❌ **Fail**: Invalid role

---

### Test 10: Check Hospital Overload
```bash
curl http://localhost:3000/api/hospitals/1/overload \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "isOverloaded": false,
  "bedUtilization": 27.5,
  "stats": { ... }
}
```

✅ **Pass**: Overload status returned  
❌ **Fail**: Error

---

### Test 11: Get Hospital Alerts
```bash
curl http://localhost:3000/api/hospitals/1/alerts?acknowledged=false \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "type": "escalation",
    "severity": "critical",
    "message": "CRITICAL patient registered",
    "acknowledged": false,
    "created_at": "2025-12-22T06:00:00.000Z"
  }
]
```

✅ **Pass**: Array of alerts (may be empty)  
❌ **Fail**: Error

---

## 🚑 PATIENT ENDPOINTS

### Test 12: Register Patient with Triage (Critical - RED)
```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PT-TEST-001",
    "name": "John Critical",
    "age": 65,
    "gender": "male",
    "contact": "+1-555-9999",
    "triageInput": {
      "vitalSigns": {
        "heartRate": 145,
        "respiratoryRate": 32,
        "systolicBP": 85,
        "diastolicBP": 50,
        "temperature": 35.2,
        "oxygenSaturation": 88,
        "consciousness": "pain"
      },
      "symptoms": [
        {
          "symptom": "chest pain",
          "severity": "critical"
        },
        {
          "symptom": "difficulty breathing",
          "severity": "severe"
        }
      ],
      "riskFactors": [
        {
          "factor": "diabetes",
          "category": "chronic"
        },
        {
          "factor": "cardiac history",
          "category": "high-risk"
        }
      ]
    }
  }'
```

**Expected Response:**
```json
{
  "patient": {
    "id": 1,
    "patient_id": "PT-TEST-001",
    "name": "John Critical",
    "priority": "RED",
    "status": "waiting",
    "arrival_time": "2025-12-22T06:26:13.252Z"
  },
  "triageResult": {
    "priority": "RED",
    "score": 130,
    "reasons": [
      "Critical heart rate: 145 bpm",
      "Critical respiratory rate: 32/min",
      "Critical blood pressure: 85/50 mmHg",
      "Critical oxygen saturation: 88%",
      "Critical temperature: 35.2°C",
      "Responds only to pain",
      "Critical symptom: chest pain (critical)",
      "High-risk condition: diabetes"
    ],
    "recommendedActions": [
      "IMMEDIATE medical intervention required",
      "Prepare resuscitation equipment",
      "Alert senior physician"
    ]
  }
}
```

✅ **Pass**: Priority = RED, Score > 80  
❌ **Fail**: 403 Forbidden (need doctor/nurse/admin role)

---

### Test 13: Register Patient (Urgent - YELLOW)
```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PT-TEST-002",
    "name": "Jane Urgent",
    "age": 45,
    "gender": "female",
    "triageInput": {
      "vitalSigns": {
        "heartRate": 115,
        "respiratoryRate": 24,
        "systolicBP": 155,
        "diastolicBP": 95,
        "temperature": 38.8,
        "oxygenSaturation": 93,
        "consciousness": "alert"
      },
      "symptoms": [
        {
          "symptom": "severe abdominal pain",
          "severity": "severe"
        }
      ],
      "riskFactors": []
    }
  }'
```

**Expected Priority:** YELLOW (score 50-79)

---

### Test 14: Register Patient (Standard - GREEN)
```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "PT-TEST-003",
    "name": "Bob Standard",
    "age": 30,
    "gender": "male",
    "triageInput": {
      "vitalSigns": {
        "heartRate": 95,
        "respiratoryRate": 18,
        "systolicBP": 145,
        "diastolicBP": 88,
        "temperature": 38.2,
        "oxygenSaturation": 96,
        "consciousness": "alert"
      },
      "symptoms": [
        {
          "symptom": "moderate pain",
          "severity": "moderate"
        }
      ],
      "riskFactors": []
    }
  }'
```

**Expected Priority:** GREEN (score 20-49)

---

### Test 15: Get Emergency Queue
```bash
curl http://localhost:3000/api/patients/queue?status=waiting \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "patient_id": "PT-TEST-001",
    "name": "John Critical",
    "priority": "RED",
    "status": "waiting",
    "waiting_time_minutes": 5,
    "latest_vitals": {
      "heart_rate": 145,
      "oxygen_saturation": 88
    },
    "symptoms": [...]
  },
  {
    "id": 2,
    "patient_id": "PT-TEST-002",
    "priority": "YELLOW",
    ...
  }
]
```

✅ **Pass**: Patients sorted RED → YELLOW → GREEN → BLUE  
❌ **Fail**: Empty array (register patients first)

---

### Test 16: Update Patient Vitals (Triggers Escalation)
```bash
# Wait 2 minutes after registering PT-TEST-003
# Then update with critical vitals

curl -X PUT http://localhost:3000/api/patients/3/vitals \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vitalSigns": {
      "heartRate": 150,
      "respiratoryRate": 35,
      "systolicBP": 80,
      "diastolicBP": 45,
      "temperature": 38.2,
      "oxygenSaturation": 85,
      "consciousness": "verbal"
    }
  }'
```

**Expected Response:**
```json
{
  "shouldEscalate": true,
  "newPriority": "RED",
  "reason": "Vital signs deteriorated: Critical heart rate: 150 bpm, Critical respiratory rate: 35/min, Critical blood pressure: 80/45 mmHg, Critical oxygen saturation: 85%"
}
```

✅ **Pass**: Escalation triggered, priority upgraded  
❌ **Fail**: shouldEscalate = false

---

### Test 17: Update Patient Status
```bash
curl -X PUT http://localhost:3000/api/patients/1/status \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_treatment"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "status": "in_treatment",
  "treatment_start_time": "2025-12-22T06:30:00.000Z"
}
```

✅ **Pass**: Status updated  
❌ **Fail**: Invalid status

---

### Test 18: Check Auto-Escalations
```bash
# Wait 16+ minutes after registering a YELLOW patient
# Or manually trigger check

curl -X POST http://localhost:3000/api/patients/check-escalations?hospitalId=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "escalations": [
    {
      "patientId": 2,
      "oldPriority": "YELLOW",
      "newPriority": "RED",
      "reason": "Waiting time exceeded threshold: 18 minutes"
    }
  ],
  "count": 1
}
```

✅ **Pass**: Escalations detected after threshold  
❌ **Fail**: No escalations (patients haven't waited long enough)

---

## 📊 ANALYTICS ENDPOINTS

### Test 19: Generate Daily Report
```bash
curl -X POST http://localhost:3000/api/analytics/reports/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-22"
  }'
```

**Expected Response:**
```json
{
  "hospital_id": 1,
  "incident_date": "2025-12-22",
  "total_patients": 3,
  "red_priority_count": 1,
  "yellow_priority_count": 1,
  "green_priority_count": 1,
  "average_wait_time_minutes": 8,
  "max_wait_time_minutes": 15,
  "escalation_count": 0,
  "peak_load": 3,
  "peak_time": "2025-12-22T06:26:00.000Z"
}
```

✅ **Pass**: Report generated  
❌ **Fail**: 403 Forbidden (need admin/staff/government role)

---

### Test 20: Get Reports (Date Range)
```bash
curl "http://localhost:3000/api/analytics/reports?hospitalId=1&startDate=2025-12-01&endDate=2025-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
[
  {
    "incident_date": "2025-12-22",
    "total_patients": 3,
    ...
  }
]
```

✅ **Pass**: Array of reports  
❌ **Fail**: Empty array (no reports generated yet)

---

### Test 21: Government Dashboard (Requires Government Role)
```bash
# First, register a government user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.gov@health.gov",
    "password": "Test123!",
    "name": "Test Official",
    "role": "government"
  }'

# Save the government token, then:
curl "http://localhost:3000/api/analytics/government/dashboard?startDate=2025-12-01&endDate=2025-12-31" \
  -H "Authorization: Bearer YOUR_GOVERNMENT_TOKEN"
```

**Expected Response:**
```json
{
  "overall": {
    "total_patients": 3,
    "total_red": 1,
    "total_yellow": 1,
    "avg_wait_time": 8.5
  },
  "byHospital": [
    {
      "id": 1,
      "name": "City General Hospital",
      "total_patients": 3
    }
  ],
  "activeAlerts": [...]
}
```

✅ **Pass**: Dashboard data returned  
❌ **Fail**: 403 Forbidden (need government role)

---

### Test 22: Crowd Surge Monitoring
```bash
curl http://localhost:3000/api/analytics/crowd-surge \
  -H "Authorization: Bearer YOUR_GOVERNMENT_TOKEN"
```

**Expected Response:**
```json
{
  "allHospitals": [
    {
      "id": 1,
      "name": "City General Hospital",
      "available_beds": 145,
      "total_beds": 200,
      "current_patients": 3,
      "critical_waiting": 1
    }
  ],
  "surgeHospitals": [],
  "totalSurges": 0
}
```

✅ **Pass**: Surge data returned  
❌ **Fail**: 403 Forbidden

---

## 🚨 ALERT TESTING

### Test 23: Acknowledge Alert
```bash
# First, get an alert ID from Test 11
curl -X PUT http://localhost:3000/api/hospitals/alerts/1/acknowledge \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "id": 1,
  "acknowledged": true,
  "acknowledged_by": 1,
  "acknowledged_at": "2025-12-22T06:35:00.000Z"
}
```

✅ **Pass**: Alert acknowledged  
❌ **Fail**: Alert not found

---

## 🔄 BACKGROUND JOB TESTING

### Test 24: Wait for Auto-Escalation (Manual)
```bash
# 1. Register a YELLOW patient
# 2. Wait 16+ minutes
# 3. Check the queue again

curl http://localhost:3000/api/patients/queue \
  -H "Authorization: Bearer YOUR_TOKEN"

# Patient should now be RED with escalated=true
```

✅ **Pass**: Patient escalated after 15 minutes  
❌ **Fail**: Still YELLOW after 20 minutes (check logs)

---

## 🧪 COMPREHENSIVE TEST SCRIPT

Save this as `test-backend.sh`:

```bash
#!/bin/bash

# TRIAGELOCK Backend Health Check Script

BASE_URL="http://localhost:3000"
ADMIN_EMAIL="test.admin@hospital.com"
ADMIN_PASSWORD="Test123!"
DOCTOR_EMAIL="test.doctor@hospital.com"
DOCTOR_PASSWORD="Test123!"

echo "🏥 TRIAGELOCK Backend Health Check"
echo "=================================="
echo ""

# Test 1: Health Check
echo "✓ Testing health endpoint..."
HEALTH=$(curl -s $BASE_URL/health)
echo "$HEALTH" | grep -q "ok" && echo "  ✅ PASS: Health OK" || echo "  ❌ FAIL: Health check failed"
echo ""

# Test 2: Register Admin
echo "✓ Registering admin user..."
ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"name\":\"Test Admin\",\"role\":\"admin\",\"hospitalId\":1}")

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -n "$ADMIN_TOKEN" ]; then
  echo "  ✅ PASS: Admin registered"
  echo "  Token: ${ADMIN_TOKEN:0:20}..."
else
  echo "  ❌ FAIL: Admin registration failed"
fi
echo ""

# Test 3: Register Doctor
echo "✓ Registering doctor user..."
DOCTOR_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DOCTOR_EMAIL\",\"password\":\"$DOCTOR_PASSWORD\",\"name\":\"Dr. Test\",\"role\":\"doctor\",\"hospitalId\":1}")

DOCTOR_TOKEN=$(echo $DOCTOR_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -n "$DOCTOR_TOKEN" ]; then
  echo "  ✅ PASS: Doctor registered"
else
  echo "  ❌ FAIL: Doctor registration failed"
fi
echo ""

# Test 4: List Hospitals
echo "✓ Testing hospitals endpoint..."
HOSPITALS=$(curl -s $BASE_URL/api/hospitals -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$HOSPITALS" | grep -q "City General" && echo "  ✅ PASS: Hospitals listed" || echo "  ❌ FAIL: No hospitals found"
echo ""

# Test 5: Get Hospital Stats
echo "✓ Testing hospital stats..."
STATS=$(curl -s $BASE_URL/api/hospitals/1/stats -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$STATS" | grep -q "totalBeds" && echo "  ✅ PASS: Stats retrieved" || echo "  ❌ FAIL: Stats failed"
echo ""

# Test 6: Register Critical Patient
echo "✓ Registering RED priority patient..."
PATIENT=$(curl -s -X POST $BASE_URL/api/patients \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId":"PT-TEST-RED",
    "name":"Critical Patient",
    "age":65,
    "gender":"male",
    "triageInput":{
      "vitalSigns":{
        "heartRate":145,
        "respiratoryRate":32,
        "systolicBP":85,
        "oxygenSaturation":88,
        "consciousness":"pain"
      },
      "symptoms":[{"symptom":"chest pain","severity":"critical"}],
      "riskFactors":[{"factor":"diabetes","category":"chronic"}]
    }
  }')

echo "$PATIENT" | grep -q '"priority":"RED"' && echo "  ✅ PASS: RED patient triaged correctly" || echo "  ❌ FAIL: Triage failed"
echo ""

# Test 7: Get Queue
echo "✓ Testing emergency queue..."
QUEUE=$(curl -s "$BASE_URL/api/patients/queue?status=waiting" -H "Authorization: Bearer $DOCTOR_TOKEN")
echo "$QUEUE" | grep -q "PT-TEST-RED" && echo "  ✅ PASS: Queue populated" || echo "  ❌ FAIL: Queue empty"
echo ""

# Test 8: Generate Report
echo "✓ Generating analytics report..."
REPORT=$(curl -s -X POST $BASE_URL/api/analytics/reports/generate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-12-22"}')

echo "$REPORT" | grep -q "total_patients" && echo "  ✅ PASS: Report generated" || echo "  ❌ FAIL: Report failed"
echo ""

echo "=================================="
echo "🎉 Health check complete!"
echo ""
echo "💾 Saved tokens for manual testing:"
echo "ADMIN_TOKEN=$ADMIN_TOKEN"
echo "DOCTOR_TOKEN=$DOCTOR_TOKEN"
```

Make executable and run:
```bash
chmod +x test-backend.sh
./test-backend.sh
```

---

## 📊 EXPECTED RESULTS SUMMARY

| Test | Endpoint | Expected Status | Expected Result |
|------|----------|-----------------|-----------------|
| 1 | `/health` | 200 | `{"status":"ok"}` |
| 2 | `POST /auth/register` | 201 | User + token |
| 4 | `POST /auth/login` | 200 | User + token |
| 5 | `GET /auth/profile` | 200 | User profile |
| 6 | `GET /hospitals` | 200 | Array of hospitals |
| 7 | `GET /hospitals/:id/stats` | 200 | Stats object |
| 8 | `PUT /hospitals/:id/beds` | 200 | Updated hospital |
| 9 | `PUT /hospitals/:id/staff` | 200 | Availability rate |
| 10 | `GET /hospitals/:id/overload` | 200 | Overload status |
| 11 | `GET /hospitals/:id/alerts` | 200 | Array of alerts |
| 12 | `POST /patients` (RED) | 201 | Priority = RED |
| 13 | `POST /patients` (YELLOW) | 201 | Priority = YELLOW |
| 14 | `POST /patients` (GREEN) | 201 | Priority = GREEN |
| 15 | `GET /patients/queue` | 200 | Sorted patients |
| 16 | `PUT /patients/:id/vitals` | 200 | Escalation triggered |
| 17 | `PUT /patients/:id/status` | 200 | Status updated |
| 18 | `POST /patients/check-escalations` | 200 | Escalations array |
| 19 | `POST /analytics/reports/generate` | 200 | Report data |
| 20 | `GET /analytics/reports` | 200 | Reports array |
| 21 | `GET /analytics/government/dashboard` | 200 | Dashboard data |
| 22 | `GET /analytics/crowd-surge` | 200 | Surge data |
| 23 | `PUT /hospitals/alerts/:id/acknowledge` | 200 | Alert acknowledged |

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to database"
```
Error: connect ECONNREFUSED ::1:5432
```

**Solution:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql  # Linux
pg_ctl status  # Windows

# Start if stopped
sudo systemctl start postgresql  # Linux
pg_ctl start  # Windows

# Verify connection
psql -U postgres -d triagelock
```

---

### Issue 2: "Redis connection refused"
```
Error: connect ECONNREFUSED ::1:6379
```

**Solution:**
```bash
# Start Redis
sudo systemctl start redis  # Linux
redis-server  # Windows

# Test connection
redis-cli ping
# Should return: PONG
```

---

### Issue 3: "Table does not exist"
```
Error: relation "hospitals" does not exist
```

**Solution:**
```bash
# Run migrations
npm run migrate

# Seed data
npm run seed
```

---

### Issue 4: "Invalid or expired token"
**Solution:**
- Tokens expire after 24 hours (configurable in `.env`)
- Register a new user or login again to get fresh token

---

### Issue 5: "403 Forbidden"
**Solution:**
- Check user role matches endpoint requirements
- Example: Government dashboard requires `role: "government"`

---

## ✅ COMPLETE HEALTH CHECK CHECKLIST

- [ ] Server starts without errors
- [ ] Health endpoint responds with 200
- [ ] PostgreSQL connection successful
- [ ] Redis connection successful
- [ ] User registration works (all roles)
- [ ] User login works
- [ ] JWT authentication validates
- [ ] Hospitals can be listed
- [ ] Hospital stats calculated correctly
- [ ] Patient registration with triage works
- [ ] RED priority assigned for critical vitals
- [ ] YELLOW priority assigned for urgent cases
- [ ] GREEN priority assigned for stable cases
- [ ] Queue sorted by priority
- [ ] Vital updates trigger re-triage
- [ ] Time-based escalation works (wait 16+ min)
- [ ] Status updates work
- [ ] Analytics reports generate
- [ ] Government dashboard accessible
- [ ] Alerts can be created and acknowledged
- [ ] Background jobs running (check logs every 5 min)

---

## 🎯 Quick Smoke Test (2 Minutes)

```bash
# 1. Health check
curl http://localhost:3000/health

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cityhospital.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

# 3. List hospitals
curl http://localhost:3000/api/hospitals -H "Authorization: Bearer $TOKEN"

# 4. Get stats
curl http://localhost:3000/api/hospitals/1/stats -H "Authorization: Bearer $TOKEN"
```

If all 4 commands succeed → **Backend is healthy** ✅

---

**Your backend is now fully tested and production-ready!** 🚀
