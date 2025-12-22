# TRIAGELOCK System Architecture

## 🏗️ Overview

TRIAGELOCK is a **rule-based emergency triage and load management system** designed for hospitals to manage patient flow during emergencies without using AI or machine learning.

---

## 🎯 Core Principles

1. **Deterministic Logic**: No AI/ML - only rule-based decision making
2. **Real-Time Updates**: WebSocket-powered live dashboard
3. **Clinical Compliance**: Based on WHO emergency protocols
4. **Scalability**: Multi-hospital support with centralized government oversight
5. **Reliability**: Built for 24/7 emergency operations

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                        │
│  (React/Vue Dashboard - Real-time WebSocket Connection)     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS/WSS
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    NGINX REVERSE PROXY                       │
│              (Load Balancer + SSL Termination)              │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐             ┌────────▼────────┐
│  Node.js App   │             │  Node.js App    │
│  (Instance 1)  │             │  (Instance 2)   │
│                │             │                 │
│  PM2 Cluster   │             │  PM2 Cluster    │
└────┬─────┬─────┘             └─────┬─────┬────┘
     │     │                         │     │
     │     └─────────┬───────────────┘     │
     │               │                     │
┌────▼───────────────▼─────────────────────▼─────┐
│              PostgreSQL Database                │
│  (Patient Data, Triage History, Analytics)     │
└─────────────────────────────────────────────────┘
                        │
                        │
┌───────────────────────▼─────────────────────────┐
│                   Redis Cache                    │
│   (Session Store, Real-time Queue, Pub/Sub)     │
└──────────────────────────────────────────────────┘
```

---

## 🧩 Component Breakdown

### 1. **API Layer** (Express.js)
- RESTful endpoints for CRUD operations
- JWT-based authentication
- Role-based access control (RBAC)
- Request validation with express-validator
- Error handling middleware

**Key Routes:**
- `/api/auth` - Authentication
- `/api/patients` - Patient management
- `/api/hospitals` - Hospital operations
- `/api/analytics` - Reports and statistics

### 2. **WebSocket Layer** (Socket.IO)
- Real-time bi-directional communication
- Room-based broadcasting (per hospital)
- JWT authentication on connection
- Event-driven architecture

**Events:**
- `queue:update` - Queue changes
- `patient:escalated` - Priority escalations
- `alert:new` - System alerts
- `hospital:stats` - Load statistics

### 3. **Triage Engine** (Core Logic)
Pure TypeScript rule-based engine with **zero AI/ML**.

**Input:**
- Vital signs (HR, RR, BP, O2, Temp, Consciousness)
- Symptoms with severity
- Risk factors (age, chronic conditions)

**Output:**
- Priority: RED, YELLOW, GREEN, or BLUE
- Clinical score (0-100+)
- Reasoning (why this priority?)
- Recommended actions

**Algorithm:**
```
Score = Vitals Score + Symptoms Score + Risk Score

if Score >= 80:  RED (Critical)
if Score >= 50:  YELLOW (Urgent)
if Score >= 20:  GREEN (Standard)
else:            BLUE (Minor)
```

**Escalation Rules:**
- Time-based: Auto-upgrade after threshold
- Vitals-based: Re-evaluate on new readings
- Deterministic: No predictions, only rules

### 4. **Services Layer**

#### PatientService
- Patient registration with triage
- Vital signs tracking
- Status updates (waiting → treatment → discharged)
- Queue management
- Auto-escalation checks

#### HospitalService
- Bed availability tracking
- Staff availability management
- Overload detection
- Alert generation
- Statistics aggregation

#### AnalyticsService
- Daily incident reports
- Hourly statistics
- Government dashboard
- Crowd surge monitoring
- Exportable reports

#### SchedulerService
Background jobs via `node-cron`:
- Every 5 min: Check escalations
- Every 10 min: Update waiting times
- Every 15 min: Check hospital overload
- Daily 1 AM: Generate reports
- Every 5 min: Monitor crowd surges

### 5. **Database Layer** (PostgreSQL)

**Core Tables:**

```sql
hospitals
├── id, name, location
├── total_beds, available_beds
├── icu_beds, available_icu_beds
└── is_active

patients
├── id, patient_id, name, age, gender
├── hospital_id → hospitals(id)
├── priority (RED/YELLOW/GREEN/BLUE)
├── status (waiting/in_treatment/discharged)
├── arrival_time, triage_time
├── waiting_time_minutes
└── escalated (boolean)

vital_signs
├── id, patient_id → patients(id)
├── heart_rate, respiratory_rate
├── systolic_bp, diastolic_bp
├── temperature, oxygen_saturation
├── consciousness
└── recorded_at

triage_history
├── id, patient_id → patients(id)
├── old_priority, new_priority
├── reason, auto_escalated
└── changed_at

alerts
├── id, hospital_id, patient_id
├── type, severity, message
├── acknowledged, acknowledged_by
└── created_at
```

**Indexes:**
- `(hospital_id, status)` on patients
- `(priority, arrival_time)` on patients
- `(hospital_id, acknowledged, created_at)` on alerts

### 6. **Caching Layer** (Redis)

**Use Cases:**
- Session storage
- Real-time queue caching
- WebSocket pub/sub
- Rate limiting
- Temporary escalation flags

---

## 🔐 Security Architecture

### Authentication Flow
```
1. User submits email + password
2. Server validates credentials
3. Server generates JWT token
4. Token contains: userId, email, role, hospitalId
5. Client stores token (localStorage/cookies)
6. Client sends token in Authorization header
7. Middleware validates token on each request
```

### Authorization (RBAC)

| Role       | Permissions |
|------------|-------------|
| **admin**  | Full hospital control, user management |
| **doctor** | Patient registration, triage, status updates |
| **nurse**  | Patient registration, vital updates |
| **staff**  | Bed/staff availability, reports |
| **government** | Multi-hospital view, analytics, surge monitoring |

### Data Protection
- Passwords: bcrypt hashing (10 rounds)
- JWT: HS256 with secret key
- HTTPS: SSL/TLS in production
- CORS: Whitelisted frontend origins
- Rate limiting: 10 req/sec per IP

---

## 📊 Data Flow

### Patient Registration Flow
```
1. Staff enters patient data + vitals
2. API validates input
3. TriageEngine calculates priority
4. PatientService saves to database
5. VitalSigns, Symptoms, RiskFactors saved
6. TriageHistory logged
7. If RED: Alert generated
8. WebSocket emits patient:registered
9. Queue updated and broadcast
```

### Escalation Flow
```
1. Scheduler runs every 5 minutes
2. Fetch all waiting patients
3. For each patient:
   a. Calculate waiting time
   b. Check against threshold
   c. If exceeded: Upgrade priority
   d. Log to triage_history
   e. Create alert
   f. Emit patient:escalated event
4. Broadcast updated queue
```

### Real-Time Update Flow
```
1. Event occurs (new patient, escalation, etc.)
2. Service emits to WebSocketHandler
3. WebSocketHandler broadcasts to room
4. All connected clients receive update
5. Frontend updates dashboard instantly
```

---

## 🔄 Background Processing

### Scheduled Jobs

**Escalation Checker** (Every 5 min)
- Checks all waiting patients
- Applies time-based escalation rules
- Generates alerts for critical waits

**Waiting Time Updater** (Every 10 min)
- Recalculates waiting time for all active patients
- Updates database for accurate reporting

**Overload Monitor** (Every 15 min)
- Checks bed utilization
- Monitors critical case count
- Generates overload alerts

**Report Generator** (Daily 1 AM)
- Aggregates previous day's data
- Calculates statistics
- Stores in incident_reports table

**Crowd Surge Monitor** (Every 5 min)
- Checks all hospitals
- Identifies surge conditions
- Alerts government dashboard

---

## 🚀 Performance Optimizations

### Database
- Connection pooling (min: 5, max: 30)
- Strategic indexing on query paths
- Batch inserts for historical data
- Read replicas for analytics (future)

### Caching
- Redis for frequently accessed data
- Queue caching to reduce DB hits
- Session caching

### WebSocket
- Room-based broadcasting (not global)
- Event debouncing on client
- Compression for large payloads

### Application
- PM2 cluster mode (multi-core)
- Nginx load balancing
- Compression middleware
- Async/await for I/O operations

---

## 📈 Scalability Strategy

### Vertical Scaling
- Increase server resources
- Upgrade database specs
- Optimize queries

### Horizontal Scaling
- Multiple Node.js instances (PM2)
- Database read replicas
- Redis cluster
- Microservices (future split)

### Multi-Region
- Regional databases
- CDN for static assets
- Edge caching

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18+ |
| **Language** | TypeScript 5.3 |
| **Framework** | Express.js 4.18 |
| **Database** | PostgreSQL 14+ |
| **Cache** | Redis 6+ |
| **WebSocket** | Socket.IO 4.7 |
| **ORM** | Knex.js 3.0 |
| **Auth** | JWT + bcrypt |
| **Validation** | express-validator |
| **Logging** | Winston |
| **Process Manager** | PM2 |
| **Reverse Proxy** | Nginx |

---

## 🔍 Monitoring & Observability

### Logging
- Winston logger with multiple transports
- Separate files: error.log, combined.log
- Structured JSON logging
- Log rotation (daily, 14 days retention)

### Metrics
- PM2 monitoring dashboard
- Database connection pool stats
- Redis memory usage
- API response times

### Health Checks
- `/health` endpoint
- Database connectivity check
- Redis connectivity check
- System uptime

---

## 🌐 Deployment Architecture

```
┌──────────────────────────────────────────┐
│           Load Balancer (Nginx)          │
└────────────┬─────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌─────▼───┐
│ App 1  │      │  App 2  │
│ PM2    │      │  PM2    │
└───┬────┘      └─────┬───┘
    │                 │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │   PostgreSQL    │
    │   (Primary)     │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  Redis Cluster  │
    └─────────────────┘
```

---

## 🎭 Future Enhancements

1. **Mobile App**: Native iOS/Android for staff
2. **Patient Portal**: Self-check-in kiosk
3. **Integration**: HL7/FHIR with existing EMR
4. **Telemedicine**: Remote triage support
5. **Predictive Analytics**: ML for surge prediction (opt-in)
6. **Multi-Language**: i18n support
7. **Offline Mode**: PWA with sync

---

## 📞 System Boundaries

**What TRIAGELOCK Does:**
- ✅ Prioritize patients based on clinical rules
- ✅ Track emergency queue in real-time
- ✅ Auto-escalate based on wait time
- ✅ Monitor hospital capacity
- ✅ Generate operational reports
- ✅ Alert on critical conditions

**What TRIAGELOCK Doesn't Do:**
- ❌ Diagnose medical conditions
- ❌ Replace medical professionals
- ❌ Make treatment decisions
- ❌ Predict patient outcomes
- ❌ Store full medical records (EMR integration needed)

---

**Built for emergencies. Designed for speed. Powered by logic.**
