RIAGELOCK

Real-time Triage, AI-Assisted Patient Safety & Surge Intelligence

Live Deployment:
👉 https://triage-production-9233.up.railway.app/

Last updated: 26 Dec 2025

TRIAGELOCK is a full-stack, production-minded platform for emergency triage, hospital load management, and mass-casualty surge response. It combines deterministic clinical triage rules with explainable AI and city-level operational dashboards to help clinicians and public health authorities make faster, safer decisions during both routine operations and crisis situations.

The system is designed to be realistic, demo-ready, and extensible beyond a hackathon environment.


Live Demo (Recommended Entry Point)

Hosted Application:
https://triage-production-9233.up.railway.app/

From the live deployment, you can directly explore:

- Clinician workflows (triage queue, patient claiming, vitals updates)

- Government dashboard with surge forecasting and alerts

- Real-time updates powered by WebSockets

- AI-assisted risk scoring with graceful fallback to rule-based triage

Note: The hosted version runs with demo-safe defaults. AI features may fall back to deterministic logic if the ML service is not active.


What TRIAGELOCK Does Well

Real-Time Clinical Workflow

- Live patient queue with priority sorting

- Claim, handoff, and treatment-start workflows

- Structured vitals capture with history tracking

- Role-based access control (doctor, nurse, admin, staff, government)

- WebSocket synchronization so all users see updates instantly


AI-Enhanced Triage (Explainable by Design)

Per-patient deterioration prediction including:

- Risk score

- Probability of deterioration

- Predicted escalation window

- Confidence level

- Feature-importance outputs and structured reasoning

- Automatic re-scoring when vitals or symptoms change

- Safe fallback to rule-based triage if ML services are unavailable


Mass-Casualty Surge Forecaster

- Hour-by-hour patient arrival forecasts for the next 6 hours

- Confidence intervals for uncertainty awareness

- Surge detection using adaptive thresholds (historical mean + variance)

- Peak hour identification

- Actionable recommendations for staffing, beds, and transfers

- Government dashboard panel with charts, alerts, and operational guidance


Government / City-Level Mission Control

- Cross-hospital situational overview with occupancy and alerts

- Exportable incident reports and CSVs for compliance

- Automated operational playbooks:

  - Who to notify

  - How many extra beds to prepare

  - Suggested transfer strategies during overload


Persistence and Demo Reliability

- Seeded SQLite database (triagelock.sqlite3) committed to the repo

- Ensures reproducible demos without manual setup

- Supports PostgreSQL in production via DATABASE_URL


Observability and Safety

- Health checks for AI and ML services

- Background jobs for escalations, wait-time updates, and surge monitoring

- Audit-ready tables for triage history and AI predictions


Local Setup (Optional — for Development)

Backend (Express API)

npm install

npm run migrate

npm run seed   # optional (DB is already seeded)

npm run dev


ML Service (Required for AI Features)

cd ml-service

python -m venv .venv

.\.venv\Scripts\activate   # Windows

pip install -r requirements.txt

python app.py              # runs on port 5001


Frontend (React Client)

cd client

npm install

npm run dev


Local access:

Clinician view: http://localhost:5173/doctor

Government dashboard: http://localhost:5173/government


Environment notes

- Default ML service URL: http://localhost:5001

- If ML is not running, the system automatically falls back to deterministic triage rules


Key Files and Structure

- Backend API: src/server.ts, src/routes, src/controllers

- ML Service:

  ml-service/app.py

  ml-service/deterioration_predictor.py

  ml-service/surge_forecaster.py

- Frontend UI: client/src/components, client/src/pages/Government.tsx

- Seeded Demo Database: triagelock.sqlite3

- Migrations & Seeds: src/database/migrations, src/database/seeds


API Overview

ML Service (Flask)

- GET /health — service and model health

- POST /api/predict/deterioration — explainable patient risk prediction

- POST /api/forecast/surge — 6-hour surge forecast with recommendations

- POST /api/nlp/extract — symptom extraction from free-text complaints


Backend API (Express)

- POST /api/patients — register patient and run triage

- GET /api/patients/queue — fetch live triage queue

- POST /api/patients/:id/assign — clinician claims patient

- PUT /api/patients/:id/vitals — update vitals and trigger re-scoring

- POST /api/forecast/surge — ML-proxied surge forecast


Database Strategy: Demo vs Production

- SQLite is committed and seeded to guarantee reproducible demo runs

- Many hosting providers use ephemeral filesystems; runtime writes may be lost on redeploy

- Recommended production setup:

  Managed PostgreSQL

  Set DATABASE_URL

  Run migrations and seeds in CI/CD


System Architecture

Client (React)
↔ Backend API (Express + Knex + WebSockets)
↔ ML Service (Flask)

Client communicates only with the backend

Backend proxies all ML calls via a dedicated AI service layer

WebSockets power real-time updates

Background schedulers handle escalations, reports, and surge checks


Roadmap

Short term

- Migrate demo data to managed PostgreSQL

- Add CI for migrations

- Improve AI calibration and evaluation dashboards

- Expand audit logging and clinician handoff history

Medium term

- Clinical validation with de-identified hospital data

- Pilot deployment with 1–3 hospitals

- Government system integrations

- Performance hardening, rate limiting, and SSO


Contributing

Contributions are welcome.

Fork the repository and create a feature branch

Open an issue before large changes

Do not commit secrets or .env files


License

MIT