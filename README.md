# TRIAGELOCK — Real‑time Triage, AI‑Assisted Patient Safety & Surge Intelligence

Updated: 2025-12-26T11:03:16.111Z

A full-stack, production‑minded platform for emergency triage, hospital load management, and mass‑casualty surge forecasting. TRIAGELOCK combines deterministic clinical triage rules with explainable AI models and city‑level operational dashboards to help clinicians and public health authorities make faster, safer decisions during routine and crisis operations.

Key strengths:
- Real‑time clinician experience (claim patients, update vitals, start treatment)
- Explainable AI per‑patient risk scoring (deterioration predictor with reasoning)
- Mass Casualty Surge Forecaster (6‑hour forecast, CI bands, recommendations)
- Government dashboard for cross‑hospital situational awareness and operational playbooks
- Seeded SQLite DB included for repeatable hackathon demos (triagelock.sqlite3)

---

## High‑Level Features (What makes TRIAGELOCK powerful)

1) Real‑time Clinical Workflow
- Live queue with priority sorting, claim/handoff, and treatment start flow
- Vitals capture (modal) and history
- RBAC: roles for doctor, nurse, admin, staff, government
- WebSocket sync so multiple users see updates instantly

2) AI‑Enhanced Triage
- Deterioration Predictor: risk_score, deterioration_probability, predicted escalation window, confidence
- SHAP‑style (feature importance) outputs and AI reasoning array for transparency
- Automatic re‑scoring when vitals or symptoms change
- Graceful fallback to deterministic rules if ML service is unavailable

3) Mass Casualty Surge Forecaster
- 6‑hour hourly patient arrival forecasts with lower/upper confidence bounds
- Surge detection (dynamic thresholding using historical mean + 1.5*std)
- Peak hour identification and automated recommendations (staffing, beds, transfers)
- UI: Government → SurgeForecastPanel (chart + alerts + actionable cards)

4) Government / City Mission Control
- Cross‑hospital map with status, occupancy, and active alerts
- Exportable incident reports and CSV for regulatory compliance
- Automated playbooks: who to call, how many extra beds to prepare, transfer suggestions

5) Persistence & Demo Readiness
- Default: SQLite triagelock.sqlite3 (committed and seeded) for reproducible demo runs
- Config supports DATABASE_URL for PostgreSQL in production

6) Observability & Safety
- Health checks for ML services and AI proxies
- Background jobs for escalations, wait‑time updates, surge monitoring
- Audit‑ready triage history and AI prediction tables

---

## Quick Demo Checklist (Hackathon friendly)

1. Backend (Express API)
- From repo root:
  - npm install
  - npm run migrate
  - npm run seed (optional — repo already includes triagelock.sqlite3)
  - npm run dev

2. ML Service (local) — required for AI features
- cd ml-service
- python -m venv .venv
- .\.venv\Scripts\activate  # Windows
- pip install -r requirements.txt
- python app.py  # listens on 5001 by default

3. Frontend (client)
- cd client
- npm install
- npm run dev
- Open: http://localhost:5173 → /government (Government dashboard) and /doctor (Clinician view)

Environment tips:
- ML service URL: set ML_SERVICE_URL (default http://localhost:5001)
- If NOT running ML service, AI features gracefully fall back to rule‑based behavior

---

## Important Files & Locations

- Backend API: src/server.ts, src/routes, src/controllers
- ML models & endpoints: ml-service/app.py, ml-service/surge_forecaster.py, ml-service/deterioration_predictor.py
- Frontend UI: client/src/components (Doctor, Nurse, Government pages), client/src/pages/Government.tsx
- Demo DB (seeded): triagelock.sqlite3 (committed for reproducibility in demos)
- Seeds & migrations: src/database/migrations, src/database/seeds

---

## API & ML Endpoints (Summary)

AI / ML service (Flask) — used by backend aiService proxy:
- GET /health — ML service health + model loaded flags
- POST /api/predict/deterioration — returns explainable per‑patient prediction
- POST /api/forecast/surge — returns 6‑hour surge forecast + recommendations
- POST /api/nlp/extract — extracts symptoms/conditions from chief complaint

Backend API (Express) — key routes:
- POST /api/patients — register patient and run triage
- GET /api/patients/queue — fetch live queue (used by clinician UI)
- POST /api/patients/:id/assign — claim patient (doctor)
- PUT /api/patients/:id/vitals — update vitals (triggers AI refresh)
- POST /api/forecast/surge — proxied to ML service via aiService

---

## Database & Persistence — Demo vs Production

- For hackathon demos, triagelock.sqlite3 is committed and seeded so every deploy/run is reproducible.
- Caveat: many hosting providers use ephemeral filesystems — runtime writes to the committed SQLite may be lost on redeploy.
- Recommended production path: provide a managed Postgres instance (set DATABASE_URL) and run migrations/seeds there; update knex config accordingly.

---

## Architecture Overview

Client (React) ↔ Backend API (Express + Knex + WebSocket) ↔ ML Service (Flask)

- Client talks to Express for all app API needs; Express proxies ML calls to the ML service (aiService).
- WebSocket broadcasts queue/alert changes to connected clients.
- Background scheduler performs escalations, report generation, and surge checks.

---

## Roadmap & Production Considerations

Short term (week‑by‑week for post‑hackathon):
- Migrate demo data to managed Postgres and enable migrations CI
- Improve AI model calibration and add model evaluation dashboards
- Add audit logs and multi‑user handoff history

Medium term:
- Clinical validation with de‑identified hospital data
- Operational pilot with 1–3 hospitals and Government dashboard integration
- Performance hardening, rate limits, and SSO integration

---

## Contributing

We welcome pull requests. For significant changes, please open an issue first to discuss your ideas.

- Fork the repo, create a feature branch, and submit a PR against `main`.
- Keep secrets out of the repo (do NOT commit .env files).

---

## License

MIT

---

## Contact

Repo: https://github.com/A-I-C-A/T.R.I.A.G.E (branch: main)
Demo lead: [Your name] • [email]

If you want, a one‑page PDF summary for judges can be generated from this README.
