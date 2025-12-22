# TRIAGELOCK API Documentation

## Base URL
```
http://localhost:3000/api
```

---

## Authentication

All endpoints except `/auth/register` and `/auth/login` require authentication.

**Authorization Header:**
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "doctor",
  "hospitalId": 1
}
```

**Roles:** `admin`, `doctor`, `nurse`, `staff`, `government`

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "doctor",
    "hospitalId": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Profile
```http
GET /auth/profile
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "doctor",
  "hospital_id": 1,
  "is_active": true
}
```

---

## 2. Patient Endpoints

### Register Patient with Triage
```http
POST /patients
```

**Permission:** `doctor`, `nurse`, `admin`, `staff`

**Request Body:**
```json
{
  "patientId": "PT-2025-001",
  "name": "Jane Smith",
  "age": 45,
  "gender": "female",
  "contact": "+1-555-1234",
  "triageInput": {
    "vitalSigns": {
      "heartRate": 120,
      "respiratoryRate": 24,
      "systolicBP": 160,
      "diastolicBP": 95,
      "temperature": 38.5,
      "oxygenSaturation": 92,
      "consciousness": "alert"
    },
    "symptoms": [
      {
        "symptom": "chest pain",
        "severity": "severe"
      },
      {
        "symptom": "shortness of breath",
        "severity": "moderate"
      }
    ],
    "riskFactors": [
      {
        "factor": "diabetes",
        "category": "chronic"
      }
    ]
  }
}
```

**Response:**
```json
{
  "patient": {
    "id": 1,
    "patient_id": "PT-2025-001",
    "name": "Jane Smith",
    "age": 45,
    "priority": "YELLOW",
    "status": "waiting",
    "arrival_time": "2025-12-22T10:30:00.000Z"
  },
  "triageResult": {
    "priority": "YELLOW",
    "score": 65,
    "reasons": [
      "Elevated heart rate: 120 bpm",
      "Elevated respiratory rate: 24/min",
      "Critical symptom: chest pain (severe)",
      "High-risk condition: diabetes"
    ],
    "recommendedActions": [
      "Urgent care needed within 30 minutes",
      "Continuous monitoring"
    ]
  }
}
```

### Get Emergency Queue
```http
GET /patients/queue?status=waiting
```

**Query Parameters:**
- `status` (optional): `waiting`, `in_treatment`, `discharged`, `admitted`, `referred`

**Response:**
```json
[
  {
    "id": 1,
    "patient_id": "PT-2025-001",
    "name": "Jane Smith",
    "age": 45,
    "priority": "RED",
    "status": "waiting",
    "arrival_time": "2025-12-22T10:30:00.000Z",
    "waiting_time_minutes": 45,
    "escalated": true,
    "latest_vitals": {
      "heart_rate": 120,
      "oxygen_saturation": 92
    },
    "symptoms": [
      {
        "symptom": "chest pain",
        "severity": "severe"
      }
    ]
  }
]
```

### Update Patient Vitals
```http
PUT /patients/:patientId/vitals
```

**Permission:** `doctor`, `nurse`, `admin`

**Request Body:**
```json
{
  "vitalSigns": {
    "heartRate": 110,
    "respiratoryRate": 22,
    "systolicBP": 150,
    "diastolicBP": 90,
    "temperature": 38.2,
    "oxygenSaturation": 94,
    "consciousness": "alert"
  }
}
```

**Response:**
```json
{
  "shouldEscalate": false
}
```

Or if escalation occurred:
```json
{
  "shouldEscalate": true,
  "newPriority": "RED",
  "reason": "Vital signs deteriorated: Critical oxygen saturation: 88%"
}
```

### Update Patient Status
```http
PUT /patients/:patientId/status
```

**Permission:** `doctor`, `nurse`, `admin`

**Request Body:**
```json
{
  "status": "in_treatment"
}
```

**Status Values:** `waiting`, `in_treatment`, `discharged`, `admitted`, `referred`

**Response:**
```json
{
  "id": 1,
  "status": "in_treatment",
  "treatment_start_time": "2025-12-22T11:15:00.000Z"
}
```

### Check Escalations
```http
POST /patients/check-escalations?hospitalId=1
```

**Permission:** `admin`, `staff`

**Response:**
```json
{
  "escalations": [
    {
      "patientId": 3,
      "oldPriority": "GREEN",
      "newPriority": "YELLOW",
      "reason": "Waiting time exceeded threshold: 65 minutes"
    }
  ],
  "count": 1
}
```

---

## 3. Hospital Endpoints

### List Hospitals
```http
GET /hospitals
```

**Response:**
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
  }
]
```

### Get Hospital Statistics
```http
GET /hospitals/:hospitalId/stats
```

**Response:**
```json
{
  "totalBeds": 200,
  "availableBeds": 150,
  "icuBeds": 30,
  "availableIcuBeds": 20,
  "currentLoad": 35,
  "waitingPatients": 25,
  "inTreatment": 10,
  "criticalCases": 3,
  "urgentCases": 8,
  "staffAvailability": [
    {
      "role": "doctor",
      "available_count": 15,
      "total_count": 20
    }
  ]
}
```

### Update Bed Availability
```http
PUT /hospitals/:hospitalId/beds
```

**Permission:** `admin`, `staff`

**Request Body:**
```json
{
  "availableBeds": 145,
  "availableIcuBeds": 18
}
```

### Update Staff Availability
```http
PUT /hospitals/:hospitalId/staff
```

**Permission:** `admin`, `staff`

**Request Body:**
```json
{
  "role": "doctor",
  "availableCount": 12,
  "totalCount": 20
}
```

**Roles:** `doctor`, `nurse`, `specialist`, `support`

### Check Overload Status
```http
GET /hospitals/:hospitalId/overload
```

**Response:**
```json
{
  "isOverloaded": true,
  "bedUtilization": 92.5,
  "stats": { ... }
}
```

### Get Alerts
```http
GET /hospitals/:hospitalId/alerts?acknowledged=false
```

**Query Parameters:**
- `acknowledged` (optional): `true` or `false`

**Response:**
```json
[
  {
    "id": 1,
    "type": "escalation",
    "severity": "critical",
    "message": "CRITICAL patient registered: Unresponsive patient",
    "acknowledged": false,
    "created_at": "2025-12-22T10:45:00.000Z"
  }
]
```

**Alert Types:** `escalation`, `overload`, `critical_wait`, `bed_shortage`, `staff_shortage`
**Severity:** `low`, `medium`, `high`, `critical`

### Acknowledge Alert
```http
PUT /hospitals/alerts/:alertId/acknowledge
```

**Permission:** `admin`, `doctor`, `nurse`, `staff`

---

## 4. Analytics Endpoints

### Generate Daily Report
```http
POST /analytics/reports/generate
```

**Permission:** `admin`, `staff`, `government`

**Request Body:**
```json
{
  "date": "2025-12-21"
}
```

### Get Reports
```http
GET /analytics/reports?hospitalId=1&startDate=2025-12-01&endDate=2025-12-31
```

**Query Parameters:**
- `hospitalId` (required)
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
[
  {
    "incident_date": "2025-12-21",
    "total_patients": 85,
    "red_priority_count": 12,
    "yellow_priority_count": 30,
    "green_priority_count": 35,
    "average_wait_time_minutes": 42,
    "max_wait_time_minutes": 125,
    "escalation_count": 8,
    "peak_load": 45,
    "peak_time": "2025-12-21T18:30:00.000Z"
  }
]
```

### Government Dashboard
```http
GET /analytics/government/dashboard?startDate=2025-12-01&endDate=2025-12-31
```

**Permission:** `government` only

**Response:**
```json
{
  "overall": {
    "total_patients": 2450,
    "total_red": 250,
    "total_yellow": 800,
    "total_escalations": 120,
    "avg_wait_time": 38.5,
    "max_wait_time": 180,
    "max_peak_load": 75
  },
  "byHospital": [
    {
      "id": 1,
      "name": "City General Hospital",
      "total_patients": 850,
      "avg_wait_time": 35,
      "escalations": 45,
      "peak_load": 65
    }
  ],
  "activeAlerts": [ ... ]
}
```

### Crowd Surge Monitoring
```http
GET /analytics/crowd-surge
```

**Permission:** `government`, `admin`

**Response:**
```json
{
  "allHospitals": [
    {
      "id": 1,
      "name": "City General Hospital",
      "available_beds": 15,
      "total_beds": 200,
      "current_patients": 65,
      "critical_waiting": 8
    }
  ],
  "surgeHospitals": [ ... ],
  "totalSurges": 2
}
```

---

## WebSocket Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join hospital room
socket.emit('join:hospital', 1);

// Listen for queue updates
socket.on('queue:update', (data) => {
  console.log('Queue updated:', data);
});

// Listen for escalations
socket.on('patient:escalated', (data) => {
  console.log('Patient escalated:', data);
});

// Listen for alerts
socket.on('alert:new', (data) => {
  console.log('New alert:', data);
});
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```
