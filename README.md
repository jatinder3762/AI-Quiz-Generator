# AI Quiz Generator Platform

Production-oriented SaaS starter that transforms uploaded study documents into AI-generated MCQ quizzes.

## Tech Stack
- Frontend: Next.js 14, React, TailwindCSS, React Query, shadcn-style UI primitives
- Backend: FastAPI, SQLAlchemy, JWT auth, LangChain, ChromaDB
- Database: PostgreSQL
- Storage: S3-compatible object storage
- Reports: PDF + CSV exports

## Project Structure
- `frontend/` Next.js app and UI
- `backend/` FastAPI API, processing pipeline, AI services
- `database/` SQL schema
- `docker/` Dockerfiles
- `docs/` deployment documentation

## Deployment Guides
- Hosting setup guide: `README-HOSTING.md`
- Local development guide: `docs/local-development.md`
- Platform deployment notes: `docs/deployment.md`

## Quick Start (Local)
1. Copy env templates:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env.local`
2. Start infra and apps:
   - `docker compose up --build`
3. Frontend: http://localhost:3000
4. Backend docs: http://localhost:8000/docs

## Manual Local Dev
### Backend
1. `cd backend`
2. `python -m venv .venv`
3. `.venv\\Scripts\\activate`
4. `pip install -r requirements.txt`
5. Run schema in Postgres: `database/schema.sql`
6. Create test login users (student + admin): `python -m scripts.seed_test_users`
7. `uvicorn main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Test Login Accounts
Run the seed command first from `backend/`:
- `python -m scripts.seed_test_users`

It creates (or refreshes) these credentials:
- Student account:
   - Email: `test.user@aiquiz.local`
   - Password: `TestUser@123`
- Admin account:
   - Email: `test.admin@aiquiz.local`
   - Password: `TestAdmin@123`

## API Endpoints (v1 prefix)
- `POST /api/v1/register`
- `POST /api/v1/login`
- `POST /api/v1/upload`
- `GET /api/v1/documents`
- `POST /api/v1/generate-quiz`
- `GET /api/v1/quiz/{id}`
- `POST /api/v1/submit-quiz`
- `GET /api/v1/results/{quiz_id}`
- `GET /api/v1/results/{quiz_id}/export?format=pdf|csv`

## Security Controls
- File extension and size validation
- Prompt-injection pattern checks on extracted text
- Input validation via Pydantic
- JWT auth for protected endpoints
- Rate limit for quiz generation

## Environment Variables
### Backend
- `APP_NAME`
- `API_V1_PREFIX`
- `ENVIRONMENT`
- `DEBUG`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `ALGORITHM`
- `DATABASE_URL`
- `ALLOWED_EXTENSIONS`
- `MAX_UPLOAD_SIZE_MB`
- `S3_ENDPOINT_URL`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `S3_REGION`
- `CHROMA_PERSIST_DIRECTORY`
- `EMBEDDINGS_MODEL`
- `LLM_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `FRONTEND_URL`
- `RATE_LIMIT_QUIZ_GENERATION`

### Frontend
- `NEXT_PUBLIC_API_BASE_URL`
