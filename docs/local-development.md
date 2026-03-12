# Local Development Guide

For production deployment on VPS/cloud hosting, see `README-HOSTING.md`.

## Prerequisites
- Python 3.11+
- Node.js 20+
- Docker Desktop

## Option A: Full Docker
1. `docker compose up --build`
2. Open frontend at `http://localhost:3000`
3. Open backend docs at `http://localhost:8000/docs`

## Option B: Run Services Manually

### 1. Start Infrastructure
- Start PostgreSQL and MinIO manually, or run only infra with Docker:
  - `docker compose up postgres minio`

### 2. Backend
1. `cd backend`
2. Create env file from template.
3. Create and activate virtual environment.
4. `pip install -r requirements.txt`
5. Apply `database/schema.sql` to Postgres.
6. `uvicorn main:app --reload --port 8000`

### 3. Frontend
1. `cd frontend`
2. Create `.env.local` from `.env.example`
3. `npm install`
4. `npm run dev`

## Smoke Test Flow
1. Register a user (`/register`).
2. Upload PDF or DOCX (`/upload`).
3. Generate quiz (`/generate-quiz`).
4. Submit quiz (`/submit-quiz`).
5. View analytics (`/results/{quiz_id}`).
6. Export report (`/results/{quiz_id}/export`).
