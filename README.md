# TRIAGELOCK

**AI-Powered Emergency Triage and Hospital Load Management System**

A comprehensive platform for emergency department triage, patient deterioration prediction, and multi-hospital surge management. Built to support clinical decision-making in routine operations and mass-casualty scenarios.

**[Live Demo](https://triage-production-9233.up.railway.app/)**

---

## Overview

TRIAGELOCK is an intelligent emergency triage system that combines rule-based clinical protocols with machine learning models to optimize patient care and resource allocation. The platform provides real-time patient monitoring, AI-assisted risk assessment, and predictive analytics for hospital administrators and government health authorities.

---

## Core Features

### Clinical Triage System
- **Automated triage scoring** based on vital signs and presenting symptoms
- **Multi-level priority classification** (RED/YELLOW/GREEN) following established protocols
- **Real-time patient queue management** with dynamic priority updates
- **Patient assignment and handoff** workflows for clinical staff
- **Comprehensive vital signs tracking** with historical data visualization
- **WebSocket-based live updates** across all connected clients

### AI-Powered Deterioration Detection
- **Patient deterioration risk prediction** with probability scores
- **Explainable AI outputs** showing contributing factors and feature importance
- **Predicted escalation timeframes** for proactive intervention
- **Confidence metrics** for clinical decision support
- **Automatic re-assessment** on vital sign changes
- **Graceful degradation** to rule-based triage when ML services are unavailable

### Surge Forecasting and Capacity Planning
- **6-hour patient arrival forecasting** with confidence intervals
- **Automated surge detection** using adaptive thresholds
- **Peak hour identification** for resource allocation
- **Actionable recommendations** for staffing and bed management
- **Cross-hospital load balancing** suggestions
- **Transfer coordination** support during capacity constraints

### Multi-Hospital Government Dashboard
- **City-wide situational awareness** across all connected facilities
- **Real-time occupancy and capacity monitoring**
- **Emergency department status tracking**
- **Aggregate analytics and trend visualization**
- **Export functionality** for reporting and analysis
- **Alert system** for surge events and capacity breaches

### Role-Based Access Control
- **Doctor interface**: Full patient management and clinical decision tools
- **Nurse interface**: Patient registration, vitals entry, and basic care workflows
- **Admin interface**: User management and system configuration
- **Government interface**: Multi-hospital analytics and public health monitoring

---

## Technical Architecture

### Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite |
| **Backend API** | Node.js, Express.js, TypeScript |
| **Real-time Communication** | Socket.IO (WebSockets) |
| **Database** | SQLite (development), PostgreSQL (production), Knex.js ORM |
| **ML Service** | Python 3.11, Flask, NumPy, Pandas, scikit-learn |
| **Authentication** | JWT, bcrypt |
| **Deployment** | Railway (backend + ML), Vercel-ready (frontend) |

### System Architecture

```
┌─────────────────┐
│  React Client   │
│   (TypeScript)  │
└────────┬────────┘
         │ HTTP/WebSocket
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Express API    │◄────►│   ML Service     │
│  (Node.js/TS)   │ HTTP │   (Flask/Python) │
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│    Database     │
│ SQLite/Postgres │
└─────────────────┘
```

- Frontend communicates exclusively with the Express backend
- Backend proxies ML requests to the Python Flask service
- WebSocket connections provide real-time state synchronization
- Background schedulers handle escalations and automated forecasting

---

## API Endpoints

### Patient Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/patients` | Register new patient and calculate initial triage score |
| `GET` | `/api/patients/queue` | Retrieve current triage queue with priority sorting |
| `GET` | `/api/patients/:id` | Get detailed patient information |
| `POST` | `/api/patients/:id/assign` | Assign patient to clinician |
| `PUT` | `/api/patients/:id/vitals` | Update vital signs and trigger re-assessment |
| `POST` | `/api/patients/:id/discharge` | Discharge or transfer patient |

### Hospital Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/hospitals` | List all hospitals in the system |
| `GET` | `/api/hospitals/:id` | Get hospital details and current status |
| `PUT` | `/api/hospitals/:id/status` | Update hospital capacity and status |

### Analytics and Forecasting

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/overview` | System-wide metrics and KPIs |
| `POST` | `/api/forecast/surge` | Generate surge forecast (proxied to ML service) |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate user and issue JWT token |
| `POST` | `/api/auth/register` | Register new staff member (admin only) |

### ML Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check with model status |
| `POST` | `/api/predict/deterioration` | Patient deterioration risk prediction |
| `POST` | `/api/forecast/surge` | 6-hour patient arrival forecast |
| `POST` | `/api/nlp/extract` | Extract structured symptoms from clinical notes |

---

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- Python 3.9 or higher
- npm or yarn package manager
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/triage.git
cd triage
```

2. Install backend dependencies
```bash
npm install
```

3. Install frontend dependencies
```bash
cd client
npm install
cd ..
```

4. Install ML service dependencies
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

5. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

6. Initialize the database
```bash
npm run migrate
npm run create-admin
```

### Running the Application

#### Option 1: Run All Services Together
```bash
npm run dev
```
This starts both backend and frontend concurrently.

#### Option 2: Run Services Separately

**Backend Server:**
```bash
npm run dev:backend
```
Runs on `http://localhost:3000`

**Frontend Development Server:**
```bash
npm run dev:client
```
Runs on `http://localhost:5173`

**ML Service:**
```bash
cd ml-service
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```
Runs on `http://localhost:5001`

### Access Points

- **Doctor Dashboard:** `http://localhost:5173/doctor`
- **Nurse Dashboard:** `http://localhost:5173/nurse`
- **Admin Panel:** `http://localhost:5173/admin`
- **Government Dashboard:** `http://localhost:5173/government`
- **API Documentation:** `http://localhost:3000/api`

### Default Credentials

After running `npm run create-admin`, use:
- Username: (set during creation)
- Password: (set during creation)

---

## Production Deployment

### Environment Variables

Required environment variables for production:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key
ML_SERVICE_URL=https://your-ml-service.com
```

### Build Process

```bash
# Build backend
npm run build:backend

# Build frontend
npm run build:client

# Start production server
npm start
```

### Database Migration

The system automatically runs migrations on startup in production. For manual migration:

```bash
npm run migrate
```

---

## Database Schema

### Key Tables

- **users**: Staff members with role-based permissions
- **patients**: Patient demographic and clinical information
- **triage_assessments**: Historical triage scores and reasoning
- **vital_signs**: Time-series vital sign measurements
- **hospitals**: Hospital registry with capacity information
- **ai_predictions**: ML model predictions with confidence scores and explanations

---

## Machine Learning Models

### Deterioration Prediction Model
- **Input Features**: Vital signs, age, triage category, symptoms
- **Output**: Risk score (0-100), probability, time horizon, confidence
- **Model Type**: Ensemble (Random Forest + Gradient Boosting)
- **Explainability**: Feature importance scores and clinical reasoning

### Surge Forecasting Model
- **Input Features**: Historical arrival patterns, time of day, day of week
- **Output**: Hourly predictions with confidence intervals
- **Model Type**: Time series forecasting with seasonal decomposition
- **Alerts**: Automatic threshold-based surge detection

### NLP Symptom Extractor
- **Input**: Free-text clinical notes
- **Output**: Structured symptom list with severity
- **Approach**: Rule-based extraction with medical terminology matching

---

## Contributing

We welcome contributions to improve TRIAGELOCK. Please follow these guidelines:

1. Fork the repository and create a feature branch
2. Follow the existing code style and conventions
3. Write tests for new features
4. Ensure all tests pass before submitting
5. Do not commit sensitive data, credentials, or `.env` files
6. Submit a pull request with a clear description of changes

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Team

Developed by Team A.I.C.A
