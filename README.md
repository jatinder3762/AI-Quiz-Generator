<p align="center">
  <img src="frontend/public/logo-ai-quiz.png" alt="AI Quiz Generator" width="120" />
</p>

<h1 align="center">AI Quiz Generator</h1>

<p align="center">
  Transform any PDF or DOCX study document into an AI-powered multiple-choice quiz in seconds.<br/>
  Built with Next.js 14, FastAPI, LangChain, PostgreSQL, and MinIO.
</p>

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup — With Docker Compose](#setup--with-docker-compose-recommended)
- [Setup — Without Docker (Manual)](#setup--without-docker-manual)
- [Environment Variables](#environment-variables)
- [Test Accounts](#test-accounts)
- [Demo Mode](#demo-mode)
- [Deployment (Cloud)](#deployment-cloud)
- [API Docs](#api-docs)

---

## Features

| Feature | Details |
|---|---|
| 📄 Document Upload | Upload PDF or DOCX files (max 15 MB). Supports slide-deck PDFs via pdfminer fallback. |
| 🤖 AI Quiz Generation | LangChain + LLM generates MCQs from document content using vector search (ChromaDB). |
| 📚 Multi-Document Quizzes | Select multiple uploaded documents to generate a combined quiz. |
| 📊 Results & Scoring | Instant scoring with a visual score chart and per-question review. |
| 📥 Export Reports | Download quiz results as PDF or CSV. |
| 🧪 Demo Mode | Try the full UI without creating an account — no data leaves your browser. |
| 🔐 JWT Authentication | Secure register/login with role-based access (student / admin). |
| 🗂️ Dashboard | View all uploaded documents, quiz history, and average score. |
| 🚀 Progress Bar | Animated real-time progress overlay during quiz generation. |
| 📱 Responsive UI | Sticky frosted-glass navbar, mobile hamburger menu, user avatar dropdown. |

---

## Screenshots

### Demo — Upload & Generate Quiz
![Demo Upload & Generate Quiz](docs/screenshots/Screenshot_2.jpg)
*Visit `/demo` to upload a document and generate a quiz instantly — no account needed. Files stay in your browser.*

### Demo — Quiz Results & User Menu
![Demo Quiz Results](docs/screenshots/Screenshot_1.jpg)
*View your quiz results in demo mode. The user avatar dropdown gives quick access to all pages.*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TailwindCSS, TanStack Query, Recharts |
| Backend | FastAPI, SQLAlchemy (async), Pydantic v2, Uvicorn |
| AI / NLP | LangChain, LangChain-OpenAI, ChromaDB (vector store) |
| LLM | OpenAI API or self-hosted Ollama (configurable) |
| Database | PostgreSQL 16 |
| Object Storage | MinIO (S3-compatible) or AWS S3 / Cloudflare R2 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Reports | ReportLab (PDF), built-in CSV |
| Containerisation | Docker, Docker Compose |

---

## Project Structure

```
AI-Quiz-Generator/
├── backend/
│   ├── app/
│   │   ├── api/routers/       # FastAPI route handlers
│   │   ├── core/              # Config, security
│   │   ├── db/                # Database session
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic (LLM, vector store, storage…)
│   │   └── utils/             # Rate limiter, sanitizer
│   ├── scripts/               # Seed scripts
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # Shared UI components
│   ├── lib/                   # API client, auth store, demo store
│   ├── types/                 # TypeScript types
│   └── public/                # Static assets (logo, etc.)
├── database/
│   └── schema.sql             # Full PostgreSQL schema
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml
└── docs/
    ├── local-development.md
    ├── deployment.md
    └── screenshots/
```

---

## Prerequisites

### With Docker Compose
| Requirement | Minimum version |
|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 24+ |
| [Docker Compose](https://docs.docker.com/compose/) | v2.20+ (bundled with Docker Desktop) |
| Git | any |

### Without Docker (Manual)
| Requirement | Minimum version | Notes |
|---|---|---|
| [Python](https://www.python.org/downloads/) | 3.10+ | 3.11 recommended |
| [Node.js](https://nodejs.org/) | 18 LTS+ | 20 LTS recommended |
| [PostgreSQL](https://www.postgresql.org/download/) | 14+ | or use Docker for DB only |
| [MinIO](https://min.io/download) | latest | or use Docker for MinIO only |
| Git | any | |

### LLM Provider (either)
| Option | Details |
|---|---|
| **OpenAI** (cloud) | Requires `OPENAI_API_KEY`. Uses `gpt-4o-mini` by default. |
| **Ollama** (local, free) | Install [Ollama](https://ollama.com/), run `ollama pull gemma3:4b`. Set `OPENAI_BASE_URL=http://localhost:11434/v1` and `OPENAI_API_KEY=ollama` in `.env`. |

---

## Setup — With Docker Compose (Recommended)

This spins up PostgreSQL, MinIO, the FastAPI backend, and the Next.js frontend in one command.

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/AI-Quiz-Generator.git
cd AI-Quiz-Generator
```

### 2. Copy environment files
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Configure your LLM key
Open `backend/.env` and set:
```env
OPENAI_API_KEY=sk-...          # OpenAI key
# OR for local Ollama:
# OPENAI_API_KEY=ollama
# OPENAI_BASE_URL=http://host.docker.internal:11434/v1
# OPENAI_MODEL=gemma3:4b
```

### 4. Start all services
```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:8081 |
| API Docs (Swagger) | http://localhost:8081/docs |
| MinIO Console | http://localhost:9021 (user: `minioadmin` / `minioadmin`) |

### 5. Seed test accounts (optional)
```bash
docker compose exec backend python -m scripts.seed_test_users
```

### Stop services
```bash
docker compose down

# To also remove stored data volumes:
docker compose down -v
```

---

## Setup — Without Docker (Manual)

Use this approach if you prefer to run services natively or already have PostgreSQL/MinIO installed.

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/AI-Quiz-Generator.git
cd AI-Quiz-Generator
```

### 2. Start PostgreSQL & MinIO (Docker for infrastructure only)
You can still use Docker just for the databases:
```bash
docker compose up -d postgres minio
```
Or install and run them natively — see [PostgreSQL docs](https://www.postgresql.org/docs/) and [MinIO docs](https://min.io/docs/).

### 3. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, OPENAI_API_KEY, S3_* values
```

**Edit `backend/.env`:**
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5450/ai_quiz
S3_ENDPOINT_URL=http://localhost:9020
OPENAI_API_KEY=sk-...
SECRET_KEY=your-strong-random-secret
```

**Apply database schema:**
```bash
# Connect to your Postgres instance and run:
psql -U postgres -d ai_quiz -f ../database/schema.sql
```

**Start the backend:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8081 --env-file .env
```

**Seed test accounts (optional):**
```bash
python -m scripts.seed_test_users
```

### 4. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env.local
```

**Edit `frontend/.env.local`:**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081/api/v1
```

**Start the frontend:**
```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8081 |
| API Docs (Swagger) | http://localhost:8081/docs |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | ✅ | — | JWT signing secret (use a long random string) |
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string (`postgresql+asyncpg://...`) |
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key (or `ollama` for local) |
| `OPENAI_MODEL` | | `gpt-4o-mini` | LLM model name |
| `OPENAI_BASE_URL` | | OpenAI default | Override for Ollama: `http://localhost:11434/v1` |
| `S3_ENDPOINT_URL` | ✅ | — | MinIO or S3 endpoint |
| `S3_ACCESS_KEY_ID` | ✅ | — | MinIO/S3 access key |
| `S3_SECRET_ACCESS_KEY` | ✅ | — | MinIO/S3 secret key |
| `S3_BUCKET_NAME` | | `ai-quiz-files` | Storage bucket name (auto-created on startup) |
| `S3_REGION` | | `us-east-1` | Storage region |
| `EMBEDDINGS_MODEL` | | `text-embedding-3-small` | OpenAI embeddings model |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | `1440` | JWT expiry (24 h) |
| `MAX_UPLOAD_SIZE_MB` | | `15` | Max file upload size |
| `FRONTEND_URL` | | `http://localhost:3000` | CORS allow-origin |
| `DEBUG` | | `false` | Enable debug error log endpoint |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | Full URL to the backend API, e.g. `http://localhost:8081/api/v1` |

---

## Test Accounts

After running `python -m scripts.seed_test_users` from the `backend/` directory:

| Role | Email | Password |
|---|---|---|
| Student | `test.user@aiquiz.local` | `TestUser@123` |
| Admin | `test.admin@aiquiz.local` | `TestAdmin@123` |

---

## Demo Mode

Visit **`/demo`** — no account required.

- Try the full quiz flow entirely in your browser
- Upload a PDF/DOCX (up to 5 MB, max 3 files) — nothing is sent to the server
- Quiz is generated via the backend demo endpoint (no auth needed)
- Results are saved in `localStorage` for the session
- Limited to 3 files and 5 MB each

Demo data is completely isolated from real user accounts.

---

## Deployment (Cloud)

See **[README-HOSTING.md](README-HOSTING.md)** for full cloud deployment instructions covering:

- Vercel (frontend) + Render/Railway (backend) + managed Postgres
- VPS with Nginx reverse proxy and Docker Compose
- Environment variable configuration for production
- Custom domain setup

---

## API Docs

When the backend is running, interactive Swagger UI is available at:

```
http://localhost:8081/docs
```

ReDoc alternative:
```
http://localhost:8081/redoc
```

This is useful for portfolio/demo sharing because users can see the quiz structure and scoring flow immediately.

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
- `ERROR_LOG_FILE`
- `ENABLE_DEBUG_ERROR_ENDPOINT`

### Frontend
- `NEXT_PUBLIC_API_BASE_URL`
