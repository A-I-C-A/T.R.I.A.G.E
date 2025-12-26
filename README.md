# TRIAGELOCK

**Real-time Triage, AI-Assisted Patient Safety & Surge Intelligence**


> A full-stack, production-minded platform for emergency triage, hospital load management, and mass-casualty surge response.

**[Live Demo](https://triage-production-9233.up.railway.app/)**

---

## Overview

TRIAGELOCK combines deterministic clinical triage rules with explainable AI models and city-level operational dashboards to help clinicians and public health authorities make faster, safer decisions during routine operations and crisis scenarios. The system is built to be realistic, demo-ready, and extensible beyond a hackathon environment.

---

## Key Features

### Real-Time Clinical Workflow
- **Live triage queue** with priority-based sorting (RED, YELLOW, GREEN)
- **Patient claiming, handoff, and treatment initiation**
- Structured vitals capture with historical tracking
- Role-based access control (doctor, nurse, admin, staff, government)
- WebSocket-based real-time synchronization

### AI-Enhanced Triage (Explainable)
- **Per-patient deterioration prediction:**
  - Risk score
  - Deterioration probability
  - Predicted escalation window
  - Confidence level
- Feature-importance and structured reasoning outputs
- Automatic re-scoring on vitals or symptom updates
- Graceful fallback to deterministic triage rules if ML services are unavailable

### Mass-Casualty Surge Forecaster
- Hourly patient arrival forecasts for the next 6 hours
- Lower and upper confidence bounds
- Surge detection using adaptive thresholds
- Peak hour identification
- Actionable recommendations for staffing, beds, and transfers
- Government dashboard visualization with alerts

### Government / City-Level Dashboard
- Cross-hospital situational awareness
- Occupancy and load monitoring
- Exportable reports and CSVs
- Automated operational playbooks for surge scenarios

### Persistence and Demo Readiness
- Seeded SQLite database (`triagelock.sqlite3`) committed to the repository
- Reproducible demos without manual data setup
- PostgreSQL supported for production via `DATABASE_URL`

### Observability and Safety
- Health checks for AI and ML services
- Background jobs for escalations and surge monitoring
- Audit-ready triage and AI prediction history

---

## Live Demo

The application is hosted and publicly accessible:

**https://triage-production-9233.up.railway.app/**

Explore:
- Clinician triage workflows
- Real-time queue updates
- Government surge forecasting dashboard
- AI-assisted risk scoring (with fallback if ML service is inactive)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, TypeScript, Vite |
| **Backend** | Node.js, Express, Knex, WebSockets |
| **AI / ML** | Python, Flask, Explainable ML models |
| **Database** | SQLite (demo), PostgreSQL (production) |

---

## Architecture
```
Client (React) ↔ Backend API (Express + WebSockets) ↔ ML Service (Flask)
```

- The client communicates only with the backend API
- The backend proxies all AI requests to the ML service
- WebSockets handle real-time state updates
- Background schedulers manage escalations and forecasts

---

## API Overview

### Backend API (Express)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/patients` | Register patient and run triage |
| `GET` | `/api/patients/queue` | Fetch live triage queue |
| `POST` | `/api/patients/:id/assign` | Claim patient |
| `PUT` | `/api/patients/:id/vitals` | Update vitals and re-score |
| `POST` | `/api/forecast/surge` | Surge forecast (proxied to ML) |

### ML Service (Flask)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `POST` | `/api/predict/deterioration` | Explainable patient risk prediction |
| `POST` | `/api/forecast/surge` | 6-hour surge forecast |
| `POST` | `/api/nlp/extract` | Symptom extraction from text |

---

## Local Development

### Backend
```bash
npm install
npm run migrate
npm run seed
npm run dev
```

### ML Service
```bash
cd ml-service
python -m venv .venv
.\.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd client
npm install
npm run dev
```

### Access Points

- **Doctor UI:** http://localhost:5173/doctor
- **Government UI:** http://localhost:5173/government

---

## Database Notes

- SQLite database is committed for reproducible demos
- Some hosting providers use ephemeral storage; runtime writes may not persist
- For production, use managed PostgreSQL and set `DATABASE_URL`

---

## Roadmap

### Short Term
- [ ] PostgreSQL migration with CI-backed migrations
- [ ] AI calibration and evaluation dashboards
- [ ] Expanded audit logging

### Medium Term
- [ ] Clinical validation with de-identified hospital data
- [ ] Pilot deployment with partner hospitals
- [ ] Government system integrations
- [ ] Performance hardening and SSO

---

## Contributing

1. Fork the repository and create a feature branch
2. Open an issue before major changes
3. **Do not commit secrets or `.env` files**

We welcome contributions! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

**Made with 💚 by team A.I.C.A**
