# AI Quiz Generator Hosting Guide

This guide explains how to deploy the project on common web hosting setups.

## Hosting Options
- VPS or dedicated server (Ubuntu + Docker + Nginx)
- Cloud app platforms (Render, Railway, Fly.io)
- Split deployment (Frontend on Vercel, Backend on Render/Railway, Postgres on managed DB)

## Recommended Production Architecture
- Frontend: Next.js app served at `https://your-domain.com`
- Backend: FastAPI served at `https://api.your-domain.com`
- Database: Managed PostgreSQL (or self-hosted Postgres)
- Object storage: S3-compatible storage (AWS S3, MinIO, Cloudflare R2)

## Prerequisites (VPS)
- Ubuntu 22.04 or newer
- Domain and DNS access
- Open ports: `80`, `443`
- Docker and Docker Compose installed

## 1. Clone and Prepare
```bash
git clone <your-repo-url> ai-quiz-generator
cd ai-quiz-generator
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

## 2. Configure Environment Variables
Update `backend/.env`:
- `ENVIRONMENT=production`
- `DEBUG=false`
- `SECRET_KEY=<long-random-secret>`
- `DATABASE_URL=<postgres-connection-string>`
- `FRONTEND_URL=https://your-domain.com`
- `OPENAI_API_KEY=<your-key>` (if using OpenAI)
- `S3_*` values for your object storage

Update `frontend/.env.local`:
- `NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com/api/v1`

## 3. Build and Start Services
```bash
docker compose up -d --build
```

## 4. Configure Reverse Proxy (Nginx)
Use two server blocks:
- `your-domain.com` -> frontend container (`localhost:3000`)
- `api.your-domain.com` -> backend container (`localhost:8000`)

Example location block:
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Backend block:
```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 5. Enable HTTPS
Use Certbot:
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

## 6. Apply Database Schema
Run `database/schema.sql` against your production Postgres.

## 7. Verify Deployment
- Frontend: `https://your-domain.com`
- API docs: `https://api.your-domain.com/docs`
- Register/login flow works
- Upload and quiz generation works

## Updating Deployment
```bash
git pull
docker compose up -d --build
```

## Troubleshooting
- `401 Unauthorized`: verify JWT token exists in browser storage and backend `SECRET_KEY` did not change unexpectedly.
- CORS errors: confirm `FRONTEND_URL` in backend `.env` exactly matches your frontend URL.
- Failed uploads: verify `S3_*` credentials, bucket name, and storage endpoint.
- DB connection issues: verify `DATABASE_URL`, firewall rules, and SSL requirements for managed Postgres.
