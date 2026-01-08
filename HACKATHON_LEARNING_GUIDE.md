# TRIAGELOCK - Complete Hackathon Learning Guide
**IIT Hyderabad Hackathon Project - Team A.I.C.A**

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Complete API Reference](#complete-api-reference)
5. [Database Schema](#database-schema)
6. [Data Flow & Workflows](#data-flow--workflows)
7. [Key Components Deep Dive](#key-components-deep-dive)
8. [AI/ML Integration](#aiml-integration)
9. [Development Setup](#development-setup)
10. [Recent Updates & Features](#recent-updates--features)

---

## 🎯 Project Overview

**TRIAGELOCK** is a real-time emergency triage and hospital load management system combining:
- **Rule-based clinical triage** using vital signs, symptoms, and risk factors
- **AI-enhanced deterioration predictions** with explainability (SHAP values)
- **Real-time queue management** via WebSocket
- **Mass-casualty surge forecasting** 
- **Government dashboard** for city-level hospital monitoring

### Problem Statement
During emergencies, hospitals need to:
1. Quickly prioritize patients (RED/YELLOW/GREEN)
2. Predict which patients might deteriorate
3. Forecast patient surges to allocate resources
4. Coordinate across multiple facilities

### Live Demo
**URL:** https://triage-production-9233.up.railway.app/

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  React + TypeScript + Vite + TailwindCSS + shadcn/ui   │
│  • Doctor Dashboard    • Nurse Registration            │
│  • Government Panel    • Admin Console                 │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/REST + WebSocket (Socket.IO)
┌──────────────────┴──────────────────────────────────────┐
│               BACKEND API LAYER                         │
│  Node.js + Express + TypeScript                         │
│  • REST API Routes      • WebSocket Handler            │
│  • JWT Auth             • Triage Engine                │
│  • Background Schedulers (cron jobs)                   │
└────────┬─────────────────────┬──────────────────────────┘
         │                     │ HTTP Proxy
    ┌────┴────┐          ┌─────┴────────────────────┐
    │Database │          │   ML SERVICE LAYER       │
    │SQLite/  │          │   Python + Flask         │
    │Postgres │          │   • Deterioration AI     │
    │(Knex)   │          │   • NLP Extractor        │
    └─────────┘          │   • Surge Forecaster     │
                         │   • SHAP Explainability  │
                         └──────────────────────────┘
```

### Data Flow
1. **Client → Backend**: User actions via REST API
2. **Backend → ML Service**: AI prediction requests
3. **Backend → Client**: Real-time updates via WebSocket
4. **Backend → Database**: All persistent data
5. **Scheduler → Services**: Background auto-escalation & monitoring

---

## 💻 Technology Stack

### Frontend Libraries
| Library | Purpose | Version |
|---------|---------|---------|
| **React** | UI framework | 18.3.1 |
| **TypeScript** | Type safety | 5.2.2 |
| **Vite** | Build tool | 5.1.6 |
| **TailwindCSS** | Styling | 3.4.1 |
| **shadcn/ui** | Component library (Radix UI) | Latest |
| **Recharts** | Charts & visualization | 2.12.2 |
| **Socket.IO Client** | WebSocket | 4.7.2 |
| **React Router** | Routing | 6.22.0 |
| **Axios** | HTTP client | 1.6.7 |
| **Framer Motion** | Animations | 11.0.8 |
| **Lucide React** | Icons | 0.344.0 |

### Backend Libraries
| Library | Purpose | Version |
|---------|---------|---------|
| **Express** | Web framework | 4.18.2 |
| **TypeScript** | Type safety | 5.3.3 |
| **Knex** | SQL query builder | 3.0.1 |
| **SQLite3** | Database (dev) | 5.1.7 |
| **PostgreSQL** | Database (prod) | 8.11.3 |
| **Socket.IO** | WebSocket server | 4.7.2 |
| **jsonwebtoken** | Authentication | 9.0.2 |
| **bcrypt** | Password hashing | 5.1.1 |
| **node-cron** | Task scheduling | 3.0.3 |
| **Winston** | Logging | 3.11.0 |
| **Helmet** | Security headers | 7.1.0 |
| **express-validator** | Input validation | 7.0.1 |

### ML Service Libraries
| Library | Purpose | Version |
|---------|---------|---------|
| **Flask** | Web framework | 3.0.0 |
| **NumPy** | Numerical computing | 1.26.2 |
| **Pandas** | Data manipulation | 2.1.4 |
| **scikit-learn** | ML algorithms | 1.3.2 |
| **XGBoost** | Gradient boosting | 2.0.3 |
| **SHAP** | Explainability | 0.44.0 |
| **spaCy** | NLP | 3.7.2 |
| **Transformers** | Pre-trained models | 4.36.2 |
| **Prophet** | Time series forecasting | 1.1.5 |

---

## 📡 Complete API Reference

### Authentication Routes (`/api/auth`)

#### **POST** `/api/auth/register`
Register new user

**Request:**
```json
{
  "email": "doctor@hospital.com",
  "password": "password123",
  "name": "Dr. John Doe",
  "role": "doctor",
  "hospitalId": 1
}
```

**Response:**
```json
{
  "user": { "id": 1, "email": "...", "name": "...", "role": "doctor" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validations:**
- Email must be valid
- Password ≥ 6 characters
- Role: `admin | doctor | nurse | staff | government`

---

#### **POST** `/api/auth/login`
Authenticate user

**Request:**
```json
{
  "email": "doctor@hospital.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": { "id": 1, "email": "...", "role": "doctor", "hospitalId": 1 },
  "token": "JWT_TOKEN_HERE"
}
```

---

#### **GET** `/api/auth/profile`
Get current user profile

**Headers:** `Authorization: Bearer <token>`

**Response:** User object

---

### Patient Routes (`/api/patients`)

#### **POST** `/api/patients`
Register patient & run triage

**Headers:** `Authorization: Bearer <token>`  
**Permissions:** `doctor, nurse, admin, staff`

**Request:**
```json
{
  "patientId": "P12345",
  "name": "Jane Smith",
  "age": 45,
  "gender": "female",
  "triageInput": {
    "vitalSigns": {
      "heartRate": 120,
      "respiratoryRate": 24,
      "systolicBP": 160,
      "diastolicBP": 95,
      "temperature": 38.5,
      "oxygenSaturation": 94,
      "consciousness": "alert"
    },
    "symptoms": [
      { "symptom": "chest pain", "severity": "severe" }
    ],
    "riskFactors": [
      { "factor": "hypertension", "category": "cardiovascular" }
    ],
    "chiefComplaint": "Severe chest pain radiating to left arm"
  }
}
```

**Response:**
```json
{
  "patient": {
    "id": 101,
    "priority": "RED",
    "status": "waiting",
    "arrivalTime": "2026-01-07T12:30:00Z"
  },
  "triageResult": {
    "priority": "RED",
    "score": 75,
    "reasons": ["Abnormal heart rate: 120 bpm", "Critical symptom: chest pain"],
    "recommendedActions": ["IMMEDIATE medical intervention required"],
    "recommendedSpecialty": "Cardiology",
    "aiPrediction": {
      "riskScore": 82,
      "deteriorationProbability": 0.73,
      "predictedEscalationTime": "2026-01-07T13:15:00Z",
      "confidence": 0.89,
      "aiReasoning": ["High HR with chest pain indicates cardiac event"],
      "shapValues": { "heart_rate": 25, "oxygen_saturation": 20 }
    }
  }
}
```

**What Happens:**
1. Triage engine calculates priority (rule-based)
2. ML service predicts deterioration (if available)
3. Patient saved to DB with vitals, symptoms, risk factors
4. WebSocket broadcasts to all clients in hospital
5. Alert created if RED priority

---

#### **GET** `/api/patients/queue`
Get patient queue

**Query Params:**
- `hospitalId` (optional)
- `status` (optional): `waiting,in_treatment,discharged`

**Response:**
```json
{
  "queue": [
    {
      "id": 101,
      "patientId": "P12345",
      "name": "Jane Smith",
      "priority": "RED",
      "status": "waiting",
      "waitingTimeMinutes": 15,
      "recommendedSpecialty": "Cardiology"
    }
  ],
  "stats": { "total": 1, "red": 1, "yellow": 0, "green": 0 }
}
```

---

#### **PUT** `/api/patients/:patientId/vitals`
Update vitals (triggers re-triage)

**Permissions:** `doctor, nurse, admin`

**Request:**
```json
{
  "vitalSigns": {
    "heartRate": 135,
    "oxygenSaturation": 92
  }
}
```

**Response:**
```json
{
  "patient": {...},
  "shouldEscalate": true,
  "newPriority": "RED",
  "reason": "Vital signs deteriorated: O2 saturation 92%"
}
```

**Side Effects:**
- New vital signs saved to `vital_signs` table
- If escalated: priority updated, alert created
- WebSocket broadcasts escalation event

---

#### **PUT** `/api/patients/:patientId/status`
Update patient status

**Request:**
```json
{
  "status": "in_treatment"
}
```

**Valid Status:** `waiting | in_treatment | discharged | admitted | referred`

---

#### **POST** `/api/patients/:patientId/assign`
Assign patient to doctor

**Permissions:** `doctor, admin`

**Request:**
```json
{
  "doctorId": 5
}
```

**Response:** Updated patient with `doctorId` and `treatmentStartTime`

---

#### **POST** `/api/patients/check-escalations`
Manually trigger escalation check

**Permissions:** `admin, staff`

**Response:**
```json
{
  "escalations": [
    {
      "patientId": 102,
      "oldPriority": "GREEN",
      "newPriority": "YELLOW",
      "reason": "Waiting time exceeded: 65 minutes"
    }
  ],
  "count": 1
}
```

---

### Hospital Routes (`/api/hospitals`)

#### **GET** `/api/hospitals`
List all hospitals

**Response:**
```json
{
  "hospitals": [
    {
      "id": 1,
      "name": "Apollo Hospital",
      "totalBeds": 500,
      "availableBeds": 120,
      "icuBeds": 50,
      "availableIcuBeds": 8
    }
  ]
}
```

---

#### **POST** `/api/hospitals`
Create hospital

**Permissions:** `admin, government`

---

#### **GET** `/api/hospitals/:hospitalId/stats`
Get hospital statistics

**Response:**
```json
{
  "totalPatients": 45,
  "waitingPatients": 23,
  "redPriority": 5,
  "yellowPriority": 12,
  "greenPriority": 28,
  "averageWaitTime": 32,
  "bedOccupancy": 76,
  "icuOccupancy": 84
}
```

---

#### **PUT** `/api/hospitals/:hospitalId/beds`
Update bed availability

**Permissions:** `admin, staff`

---

#### **GET** `/api/hospitals/:hospitalId/overload`
Check overload status

**Response:**
```json
{
  "isOverloaded": true,
  "stats": { "bedOccupancy": 92, "waitingPatients": 35 },
  "thresholds": { "bedOccupancy": 85, "waitingPatients": 30 }
}
```

---

#### **GET** `/api/hospitals/:hospitalId/alerts`
Get hospital alerts

**Response:**
```json
{
  "alerts": [
    {
      "type": "escalation",
      "severity": "critical",
      "message": "CRITICAL patient registered",
      "patientId": 101,
      "acknowledged": false
    }
  ]
}
```

---

### Analytics Routes (`/api/analytics`)

#### **POST** `/api/analytics/reports/generate`
Generate daily report

**Permissions:** `admin, staff, government`

---

#### **GET** `/api/analytics/government/dashboard`
Government dashboard (all hospitals)

**Permissions:** `government`

**Response:**
```json
{
  "hospitals": [
    {
      "id": 1,
      "name": "Apollo",
      "totalPatients": 45,
      "bedOccupancy": 76,
      "status": "normal"
    }
  ],
  "cityStats": {
    "totalHospitals": 2,
    "totalPatients": 134,
    "averageOccupancy": 85
  }
}
```

---

#### **GET** `/api/analytics/crowd-surge`
Crowd surge monitoring

**Permissions:** `government, admin`

---

### ML Service Routes (Proxied)

#### **POST** `/api/predict/deterioration`
Predict deterioration risk

**Request:**
```json
{
  "vitalSigns": {...},
  "age": 62,
  "currentPriority": "YELLOW",
  "waitingTime": 25,
  "symptoms": [...],
  "riskFactors": [...]
}
```

**Response:**
```json
{
  "prediction": {
    "risk_score": 78,
    "deterioration_probability": 0.68,
    "predicted_escalation_time": "2026-01-07T13:20:00Z",
    "confidence": 0.85,
    "predicted_priority": "RED",
    "ai_reasoning": ["Elevated HR with respiratory distress"],
    "shap_values": { "heart_rate": 22, "oxygen_saturation": 18 },
    "model_version": "1.0.0"
  }
}
```

**Key Fields:**
- `risk_score`: 0-100 deterioration risk
- `deterioration_probability`: 0-1 probability
- `shap_values`: Feature importance (explainability)

---

#### **POST** `/api/nlp/extract`
Extract symptoms from text

**Request:**
```json
{
  "text": "Patient with severe chest pain radiating to left arm, nausea. History of hypertension and diabetes."
}
```

**Response:**
```json
{
  "extraction": {
    "extracted_symptoms": [
      { "symptom": "chest pain", "severity": "severe", "confidence": 0.95 }
    ],
    "extracted_conditions": [
      { "condition": "hypertension", "type": "chronic", "confidence": 0.98 }
    ],
    "predicted_specialty": "Cardiology",
    "predicted_severity": "high",
    "suggestions": {
      "additional_symptoms_to_check": ["shortness of breath"],
      "recommended_tests": ["ECG", "Troponin levels"]
    }
  }
}
```

---

#### **POST** `/api/forecast/surge`
Forecast patient surge

**Request:**
```json
{
  "hospitalId": 1,
  "hoursAhead": 6,
  "historicalData": [
    { "timestamp": "2026-01-07T06:00:00Z", "patient_count": 12 }
  ]
}
```

**Response:**
```json
{
  "forecast": {
    "hourly_forecast": [
      {
        "timestamp": "2026-01-07T13:00:00Z",
        "predicted_patient_count": 28,
        "confidence_lower": 22,
        "confidence_upper": 35
      }
    ],
    "surge_detected": true,
    "surge_threshold": 25,
    "peak_hour": { "timestamp": "2026-01-07T18:00:00Z", "predicted_patient_count": 45 },
    "recommendations": [
      {
        "type": "staffing",
        "priority": "high",
        "action": "Call in extra staff for 6:00 PM",
        "details": "Expected 45 patients"
      }
    ]
  }
}
```

---

#### **GET** `/api/nlp/extract/health`
ML service health check

**Response:** `{ "status": "healthy" }`

---

## 🗄️ Database Schema

### **users**
```sql
id, email, password_hash, name, role, hospital_id, is_active, created_at
```
**Roles:** `admin | doctor | nurse | staff | government`

---

### **hospitals**
```sql
id, name, location, total_beds, icu_beds, available_beds, available_icu_beds, is_active
```

---

### **patients**
```sql
id, hospital_id, patient_id, name, age, gender, contact,
priority, recommended_specialty, status, doctor_id,
arrival_time, triage_time, treatment_start_time, discharge_time,
waiting_time_minutes
```
**Priority:** `RED | YELLOW | GREEN`  
**Status:** `waiting | in_treatment | discharged | admitted | referred`

---

### **vital_signs**
```sql
id, patient_id, heart_rate, respiratory_rate, systolic_bp, diastolic_bp,
temperature, oxygen_saturation, consciousness, recorded_at
```
**Consciousness:** `alert | verbal | pain | unresponsive`

---

### **symptoms**
```sql
id, patient_id, symptom, severity, recorded_at
```
**Severity:** `mild | moderate | severe | critical`

---

### **risk_factors**
```sql
id, patient_id, factor, category, recorded_at
```

---

### **triage_history**
```sql
id, patient_id, old_priority, new_priority, reason,
auto_escalated, changed_by, changed_at
```
Audit trail of all priority changes

---

### **ai_predictions**
```sql
id, patient_id, model_type, risk_score, deterioration_probability,
predicted_priority, predicted_escalation_time, confidence,
reasoning (JSON), shap_values (JSON), model_version, created_at
```

---

### **alerts**
```sql
id, hospital_id, patient_id, type, severity, message,
acknowledged, acknowledged_by, acknowledged_at, created_at
```
**Type:** `escalation | overload | surge`  
**Severity:** `low | medium | high | critical`

---

### **staff_availability**
```sql
id, hospital_id, role, available_count, total_count, updated_at
```

---

### **reports**
```sql
id, hospital_id, report_date, total_patients, red_count, yellow_count, green_count,
average_wait_time, average_treatment_time, discharge_rate, report_data (JSON), generated_at
```

---

## 🔄 Data Flow & Workflows

### 1. Patient Registration Flow

```
Nurse UI → POST /api/patients
  ↓
PatientController.register()
  ↓
PatientService.registerPatient()
  ├─ Save patient to DB
  ├─ Save vital signs
  ├─ Save symptoms & risk factors
  ↓
TriageEngine.calculatePriorityWithAI()
  ├─ Rule-based scoring (ALWAYS)
  └─ Parallel: ML service /api/predict/deterioration
  ↓
Save triage_history & ai_predictions
  ↓
If RED: Create critical alert
  ↓
WebSocket: Broadcast to hospital room
  ↓
All clients update queue in real-time
```

---

### 2. Vital Signs Update Flow

```
Doctor updates vitals
  ↓
PUT /api/patients/:id/vitals
  ↓
Save to vital_signs table
  ↓
TriageEngine.shouldEscalate()
  ↓
If escalation needed:
  ├─ Update priority
  ├─ Save triage_history
  ├─ Create alert
  └─ WebSocket broadcast
```

---

### 3. Auto-Escalation (Background Job)

```
Every 5 minutes (cron):
  ↓
For each hospital:
  For each waiting patient:
    Calculate waiting time
    ↓
    Check thresholds:
      GREEN >60 min → YELLOW
      YELLOW >15 min → RED
    ↓
    If exceeded:
      Update priority
      Create alert
      WebSocket broadcast
```

**Thresholds:**
- `CRITICAL_WAIT_TIME_MINUTES=15` (YELLOW→RED)
- `HIGH_WAIT_TIME_MINUTES=60` (GREEN→YELLOW)

---

### 4. Surge Forecasting Flow

```
Government clicks "Forecast Surge"
  ↓
Fetch historical patient data
  ↓
POST /api/forecast/surge → ML service
  ↓
SurgeForecaster.forecast()
  ├─ Analyze hourly patterns
  ├─ Generate 6-hour forecast
  ├─ Detect surge: predicted > avg + 1.5*std
  └─ Generate recommendations
  ↓
Render charts & recommendations
```

---

## 🧠 Key Components Deep Dive

### Triage Engine (Rule-Based)

**Location:** `src/services/triageEngine.ts`

#### Scoring Algorithm

```typescript
score = evaluateVitalSigns() + evaluateSymptoms() + evaluateRiskFactors()

if (score >= 40) → RED (Critical)
if (score >= 25) → YELLOW (Urgent)
else → GREEN (Standard)
```

#### Vital Signs Scoring (0-150 points)

| Vital | Critical (30 pts) | Abnormal (20 pts) | Elevated (10 pts) |
|-------|-------------------|-------------------|-------------------|
| Heart Rate | <40 or >140 | <50 or >120 | <60 or >100 |
| Respiratory Rate | <8 or >30 | <10 or >24 | <12 or >20 |
| Systolic BP | <90 or >200 | <100 or >180 | >140 |
| O2 Saturation | <90% | <94% | <96% |
| Temperature | <35 or >40 | <36 or >39 | >38 |
| Consciousness | Unresponsive (40) | Pain (25) | Verbal (15) |

#### Symptom Scoring

**Critical Symptoms (30-40 pts):**
- Chest pain, difficulty breathing, severe bleeding
- Stroke symptoms, loss of consciousness, seizure
- Anaphylaxis, severe burns

**Urgent Symptoms (15-25 pts):**
- Moderate bleeding, severe pain, high fever
- Vomiting blood, severe dehydration

**Severity Multiplier:**
- Critical: ×1.5
- Severe: ×1.2
- Moderate: ×0.8
- Mild: ×0.4

#### Risk Factor Scoring

- **Age:** <1 year (+15), >75 (+10), >65 (+5)
- **High-risk conditions** (cardiac, diabetes, immunocompromised): +20 each
- **Other conditions:** +5 each

#### Specialty Determination

```
Chest/heart symptoms → Cardiology
Breathing issues → Pulmonology
Head injury/seizures → Neurology
Trauma/bleeding → Trauma
Default → General
```

---

### AI Deterioration Predictor

**Location:** `ml-service/deterioration_predictor.py`

#### Features Used

```python
features = {
    'heart_rate', 'respiratory_rate', 'systolic_bp',
    'oxygen_saturation', 'temperature', 'consciousness',
    'age', 'current_priority', 'waiting_time',
    'symptom_count', 'risk_factor_count'
}
```

#### Output Structure

```python
{
    'risk_score': 0-100,           # Overall risk
    'deterioration_probability': 0-1,
    'predicted_escalation_time': datetime or None,
    'confidence': 0-1,
    'predicted_priority': 'RED|YELLOW|GREEN',
    'ai_reasoning': [str],         # Human-readable
    'shap_values': {feature: importance},  # Explainability
    'model_version': str
}
```

#### SHAP Explainability

SHAP values show each feature's contribution to prediction:

```json
{
  "shap_values": {
    "heart_rate": 25,       // High HR contributed +25
    "oxygen_saturation": 20, // Low O2 contributed +20
    "symptoms": 30          // Symptoms contributed +30
  }
}
```

**Interpretation:**
- Positive = increases risk
- Larger magnitude = stronger influence
- Sum ≈ risk_score

---

### NLP Symptom Extractor

**Location:** `ml-service/nlp_extractor.py`

**Technologies:**
- spaCy for NLP processing
- Medical keyword matching
- Pattern recognition
- Language detection

**Example:**

Input: "Severe chest pain, difficulty breathing, history of diabetes"

Output:
```json
{
  "extracted_symptoms": [
    {"symptom": "chest pain", "severity": "severe"},
    {"symptom": "difficulty breathing", "severity": "moderate"}
  ],
  "extracted_conditions": [
    {"condition": "diabetes", "type": "chronic"}
  ],
  "predicted_specialty": "Cardiology",
  "suggestions": {
    "additional_symptoms_to_check": ["sweating", "nausea"],
    "recommended_tests": ["ECG", "Troponin"]
  }
}
```

---

### Surge Forecaster

**Location:** `ml-service/surge_forecaster.py`

#### Algorithm

```python
1. Analyze historical hourly patterns
2. Calculate baseline: mean(patient_counts)
3. Calculate variability: std(patient_counts)
4. Forecast next N hours based on hourly averages
5. Detect surge: predicted > (baseline + 1.5 * std)
6. Identify peak hour
7. Generate recommendations
```

#### Hourly Pattern (Baseline)

```python
hourly_pattern = {
    0: 5,  1: 3,  2: 2,  3: 2,  4: 3,  5: 5,
    6: 8,  7: 12, 8: 15, 9: 18, 10: 20, 11: 22,
    12: 20, 13: 18, 14: 19, 15: 21, 16: 23, 17: 25,
    18: 22, 19: 18, 20: 15, 21: 12, 22: 10, 23: 7
}
```

#### Recommendations Logic

```python
if surge_detected:
    - Call in extra staff for peak hour
    - Prepare (peak - avg) * 0.6 extra beds
    - Alert neighboring hospitals
else:
    - Maintain standard staffing
```

---

### WebSocket Real-Time Updates

**Location:** `src/websocket/handler.ts`

#### Authentication

```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyToken(token);
  socket.data.user = user;
  next();
});
```

#### Rooms

- `hospital:<id>`: Users from specific hospital
- `government`: Government users (all hospitals)

#### Events Emitted

```javascript
// Server → Client
emit('queue:update', queueData)
emit('patient:registered', patientData)
emit('patient:escalated', escalationData)
emit('patient:status', statusData)
emit('alert:new', alertData)
emit('alert:critical', alertData)  // To government
emit('hospital:stats', statsData)
emit('crowd:surge', surgeData)
```

#### Client Subscription

```javascript
// Client joins room
socket.emit('join:hospital', hospitalId)
socket.emit('join:government')  // Government only

// Listen for events
socket.on('queue:update', (data) => {
  // Update UI
})
```

---

### Background Schedulers

**Location:** `src/services/schedulerService.ts`

#### Scheduled Jobs

| Job | Frequency | Purpose |
|-----|-----------|---------|
| `checkAllEscalations` | Every 5 min | Auto-escalate waiting patients |
| `updateWaitingTimes` | Every 10 min | Recalculate waiting times |
| `checkHospitalOverloads` | Every 15 min | Monitor capacity, create alerts |
| `generateDailyReports` | 1:00 AM daily | Performance metrics |
| `monitorCrowdSurge` | Every 5 min | Detect unusual patient influx |

#### Auto-Escalation Logic

```javascript
for (patient in waitingPatients) {
  waitingTime = now - patient.arrival_time;
  
  if (priority === 'GREEN' && waitingTime > 60 min) {
    escalate to 'YELLOW'
  }
  else if (priority === 'YELLOW' && waitingTime > 15 min) {
    escalate to 'RED'
  }
}
```

---

### Authentication & Authorization

**JWT Token Payload:**

```json
{
  "userId": 1,
  "email": "doctor@hospital.com",
  "role": "doctor",
  "hospitalId": 1,
  "iat": 1704632400,
  "exp": 1704718800
}
```

**Middleware Chain:**

```javascript
authenticate → verify JWT
  ↓
authorize(roles) → check user role
  ↓
Route handler
```

**Password Security:**

```javascript
// Registration
const hash = await bcrypt.hash(password, 10)

// Login
const valid = await bcrypt.compare(password, hash)
```

**Role Permissions:**

| Role | Permissions |
|------|-------------|
| **admin** | Full hospital access, manage users |
| **doctor** | Patient management, assignments, vitals |
| **nurse** | Patient registration, vitals updates |
| **staff** | Monitoring, bed/staff updates |
| **government** | Cross-hospital view, analytics |

---

## 🚀 Development Setup

### Prerequisites

- Node.js 20+
- Python 3.9+
- npm/yarn
- SQLite (built-in) or PostgreSQL

---

### Backend Setup

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
cp .env.example .env

# Edit .env:
PORT=3000
NODE_ENV=development
DATABASE_URL=./triagelock.sqlite3
JWT_SECRET=your-secret-key
ML_SERVICE_URL=http://localhost:5001
CRITICAL_WAIT_TIME_MINUTES=15
HIGH_WAIT_TIME_MINUTES=60

# 3. Run migrations
npm run migrate

# 4. Seed demo data (optional)
npm run seed

# 5. Create admin user
npm run create-admin

# 6. Start dev server
npm run dev
# Runs on http://localhost:3000
```

---

### Frontend Setup

```bash
cd client
npm install
npm run dev
# Runs on http://localhost:5173
```

**Environment (.env):**
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

---

### ML Service Setup

```bash
cd ml-service

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Start server
python app.py
# Runs on http://localhost:5001
```

---

### Running All Services

**Terminal 1:**
```bash
npm run dev  # Backend
```

**Terminal 2:**
```bash
cd client && npm run dev  # Frontend
```

**Terminal 3:**
```bash
cd ml-service && python app.py  # ML Service
```

---

### Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **ML Service:** http://localhost:5001
- **Health Check:** http://localhost:3000/health

---

### Default Test Credentials

After running `npm run seed`:

```
Admin:      admin@triagelock.com / admin123
Doctor:     doctor@hospital.com / doctor123
Nurse:      nurse@hospital.com / nurse123
Government: gov@city.com / gov123
```

---

## 📊 Testing Scenarios

### 1. High-Priority Patient

```json
{
  "age": 70,
  "vitalSigns": {
    "heartRate": 140,
    "respiratoryRate": 30,
    "oxygenSaturation": 88
  },
  "symptoms": [{"symptom": "chest pain", "severity": "severe"}]
}
```
**Expected:** RED priority, critical alert

---

### 2. Auto-Escalation Test

1. Register GREEN patient
2. Wait 61 minutes
3. Scheduler job runs
4. **Expected:** Auto-escalate to YELLOW

---

### 3. Vital Deterioration

1. Register YELLOW patient
2. Update vitals: O2 drops to 85%
3. **Expected:** Escalate to RED, alert created

---

### 4. NLP Extraction

```
Text: "Severe chest pain, difficulty breathing, nausea"
Expected: Extract symptoms, suggest Cardiology
```

---

### 5. Surge Detection

1. Create 30+ patients in 1 hour
2. **Expected:** Surge alert, staff recommendations

---

## 🔧 Troubleshooting

### ML Service Unavailable
- System falls back to rule-based triage
- AI predictions show as null
- Surge forecast uses deterministic pattern

### Database Locked (SQLite)
- SQLite doesn't handle high concurrency
- **Solution:** Use PostgreSQL in production

### WebSocket Not Connecting
- Check CORS settings
- Verify JWT in handshake
- Check firewall

---

## 🎯 Key Algorithms Explained

### Priority Calculation

```
Total Score = Vital Score + Symptom Score + Risk Score

if score >= 40:  priority = RED
if score >= 25:  priority = YELLOW
else:            priority = GREEN
```

### Escalation Thresholds

```
GREEN patient waiting > 60 min  → escalate to YELLOW
YELLOW patient waiting > 15 min → escalate to RED
```

### Surge Detection

```
surge_threshold = avg(historical_counts) + 1.5 * std(historical_counts)

if predicted_count > surge_threshold:
    surge_detected = True
```

---

## 📈 Performance Optimization

1. **Database Indexes**
   - `patients.priority`
   - `patients.status`
   - `patients.hospital_id`
   - `vital_signs.patient_id`

2. **WebSocket Rooms**
   - Segment by hospital (reduce broadcast overhead)

3. **Pagination**
   - Limit queue to 100 patients
   - Paginate reports

4. **Caching** (optional Redis)
   - Queue data: 5s TTL
   - Hospital stats: 30s TTL

---

## 🔒 Security Best Practices

✅ JWT with expiration (24 hours)  
✅ HTTPS only in production  
✅ Helmet middleware (security headers)  
✅ Input validation (express-validator)  
✅ SQL injection prevention (Knex parameterized queries)  
✅ Password hashing (bcrypt, 10 rounds)  
✅ CORS whitelist  
✅ Rate limiting (optional)

---

## 🚢 Deployment

### Build Commands

```bash
# Backend
npm run build        # TypeScript → JavaScript
npm run migrate      # Run DB migrations
npm start            # Production server

# Frontend
npm run build        # Vite build → dist/

# ML Service
python app.py        # Use gunicorn in production
```

### Environment (Production)

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<strong-random-key>
ML_SERVICE_URL=https://ml.example.com
```

---

## 📚 Quick Reference

### API Testing

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@hospital.com","password":"doctor123"}'

# Get Queue
curl http://localhost:3000/api/patients/queue \
  -H "Authorization: Bearer <token>"
```

### Common Commands

```bash
npm run dev              # Start backend dev
npm run build            # Build backend
npm run migrate          # Run migrations
npm run seed             # Seed demo data
cd client && npm run dev # Start frontend
cd ml-service && python app.py  # Start ML service
```

---

## 📖 Glossary

- **Triage:** Prioritizing patients by severity
- **Priority:** RED (critical), YELLOW (urgent), GREEN (standard)
- **Escalation:** Increasing patient priority
- **Surge:** Sudden influx of patients
- **SHAP:** Explainable AI feature importance
- **JWT:** JSON Web Token for authentication
- **WebSocket:** Real-time bidirectional communication
- **Knex:** SQL query builder
- **Cron:** Scheduled background jobs

---

## 🤖 AI/ML Integration

### Overview
The system integrates multiple AI/ML services for enhanced decision-making:

1. **Deterioration Predictor** - XGBoost model predicting patient deterioration risk
2. **NLP Symptom Extractor** - spaCy-based natural language processing for complaint extraction
3. **Surge Forecaster** - Time-series analysis for predicting patient influx
4. **SHAP Explainability** - Feature importance visualization for AI predictions

### Deterioration Prediction Flow

```
Patient Vitals + Symptoms → Backend API
  ↓
POST /api/predict/deterioration → ML Service (Flask)
  ↓
XGBoost Model + Feature Engineering
  ↓
SHAP Analysis (Explainability)
  ↓
{
  risk_score: 0-100,
  deterioration_probability: 0-1,
  predicted_escalation_time: timestamp,
  ai_reasoning: [reasons],
  shap_values: {feature: importance}
}
  ↓
Displayed in Doctor/Nurse UI with explanations
```

### NLP Extraction Features

**Dynamic Symptom Detection:**
- Extracts symptoms beyond predefined list
- Auto-renders UI buttons for detected symptoms
- Assigns severity levels (mild/moderate/severe/critical)
- Maps to medical specialties
- Suggests additional tests

**Recent Enhancement:**
- Previously: Only detected predefined symptoms
- Now: Flexible extraction from free-text complaints
- Auto-renders new symptom buttons in UI
- No manual selection required

**Example:**
```
Input: "Patient has burning sensation in chest and nausea"
Output:
  - burning sensation (severity: moderate) → Auto-rendered button
  - nausea (severity: mild) → Auto-rendered button
  - Specialty: Gastroenterology
  - Suggested tests: [ECG, Upper GI endoscopy]
```

### AI Reasoning & Explainability

**Why Predictions Section:**
All AI predictions now include:
1. **Risk Score Breakdown** - Feature contributions via SHAP
2. **Human-Readable Reasoning** - Plain English explanations
3. **Confidence Levels** - Model certainty (0-1)
4. **Escalation Timeline** - Predicted time to deterioration

**Display for All Priority Levels:**
- RED: High-risk reasoning with critical alerts
- YELLOW: Moderate-risk with watch recommendations
- GREEN: Low-risk with routine monitoring

### Surge Forecasting

**Algorithm:**
1. Analyze historical patient arrival patterns (hourly)
2. Calculate baseline: avg(arrivals) + 1.5 * std(arrivals)
3. Forecast next 6 hours using time-series patterns
4. Detect surge: predicted > baseline
5. Generate staffing/bed recommendations

**Recommendations Include:**
- Staff recall requirements (specific time + count)
- Extra bed preparation (quantity)
- Inter-hospital coordination alerts
- Priority levels (high/medium/low)

---

## 🎓 Learning Resources

### Understanding Triage Systems
- ESI (Emergency Severity Index)
- START Triage (Simple Triage And Rapid Treatment)
- AVPU Scale (Consciousness assessment)

### Technologies to Study
- **React Hooks:** useState, useEffect, useContext
- **TypeScript:** Interfaces, Types, Generics
- **Express Middleware:** Request pipeline
- **WebSocket:** Socket.IO rooms, events
- **SQL:** Joins, indexes, transactions
- **ML:** Supervised learning, feature engineering

---

---

## 🆕 Recent Updates & Features

### UI/UX Enhancements (Latest)

1. **Landing Page Animations**
   - Glowing card effects for all 4 role cards
   - Smooth hover transitions
   - Enhanced visual appeal

2. **Staff Recall System**
   - Prominent center-screen alert modal
   - Red glowing animation effect
   - Clear emergency messaging
   - One-click acknowledgment

3. **Hospital Registration (Government View)**
   - New "Register Hospital" feature in government panel
   - Navigation bar with tabs (Dashboard | Register Hospital)
   - Comprehensive form including:
     - Basic info (name, location, coordinates)
     - Bed capacity (General, ICU, Ventilators)
     - Specialties and doctor counts
   - Real-time map updates with randomized positioning
   - Prevents marker overlap

4. **Patient History**
   - Functional history button in doctor queue
   - Shows complete patient timeline:
     - All vital sign changes
     - Triage priority escalations
     - Treatment status updates
     - AI prediction history
   - Chronological display with timestamps

5. **AI Predictions Display**
   - Deterioration box shows for ALL priorities (RED/YELLOW/GREEN)
   - "Why This Prediction" section with:
     - SHAP value visualizations
     - Feature importance bars
     - Human-readable reasoning
     - Confidence indicators

6. **NLP Auto-Rendering**
   - Dynamically detected symptoms auto-render as buttons
   - No emoji clutter in UI
   - Clean symptom chips with severity badges
   - Automatic specialty assignment

### Technical Improvements

1. **ML Service Integration**
   - 100% integration completion
   - Graceful fallback to rule-based if ML unavailable
   - SHAP explainability for all predictions
   - Confidence scoring

2. **Database Schema Updates**
   - New `hospitals` table fields: lat/lng coordinates
   - `specialty_counts` JSON field for doctor distribution
   - `equipment_counts` for ventilators/beds

3. **WebSocket Reliability**
   - Hospital-specific room broadcasting
   - Real-time queue updates
   - Alert propagation to government dashboard

4. **Security**
   - JWT authentication on all ML endpoints
   - Role-based access control (RBAC)
   - Input validation on all forms

### Deployment Status

- **Platform:** Railway
- **Frontend:** React + Vite (SPA)
- **Backend:** Node.js + Express (API)
- **ML Service:** Python Flask (Microservice)
- **Database:** PostgreSQL (production), SQLite (dev)
- **Live URL:** https://triage-production-9233.up.railway.app/

**Deployment Safety:**
✅ Environment variables configured  
✅ Database migrations automated  
✅ ML service health checks active  
✅ CORS properly configured  
✅ Works locally and on Railway

---

**Made with 💚 by Team A.I.C.A**  
**IIT Hyderabad Hackathon 2026**

*Good luck with your presentation! 🎉*
