# Deployment Guide

## GitHub-Connected Deployment (No Manual Server)
Use this if you want CI-style deployment where every push can update production.

### 1. Frontend on Vercel
1. Connect GitHub repository in Vercel.
2. Set project root to `frontend`.
3. Add environment variable:
	- `NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>/api/v1`
4. Deploy.

### 2. Backend on Render/Railway
1. Connect the same GitHub repository.
2. Set root directory to `backend`.
3. Build command:
	- `pip install -r requirements.txt`
4. Start command:
	- `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add required backend environment variables.

### 3. Database
1. Create managed PostgreSQL instance (Supabase/Neon/Railway).
2. Set backend `DATABASE_URL`.
3. Execute `database/schema.sql` once.

### 4. Verify
1. Open `https://<frontend-domain>/demo` and run sample quizzes.
2. Register a user and test full upload -> quiz -> result flow.

### 5. Auto Deploy on Push
- Enable "Auto Deploy" in Vercel and Render/Railway so pushes to `main` redeploy automatically.

## Frontend (Vercel)
1. Import the `frontend` folder as a Vercel project.
2. Set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL with `/api/v1`.
3. Build command: `npm run build`.
4. Output: default Next.js.

## Backend (Render or Railway)
1. Deploy the `backend` folder as a Python web service.
2. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
3. Add all variables from `backend/.env.example`.
4. Provision persistent disk for `chroma_data` if using local Chroma persistence.

## Database (Supabase Postgres)
1. Create a Supabase project and copy the connection string.
2. Set `DATABASE_URL` in backend env.
3. Run `database/schema.sql` in Supabase SQL Editor.

## S3-Compatible Storage
1. Use AWS S3, Cloudflare R2, or MinIO.
2. Configure `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_REGION`.
3. Create bucket and grant upload/read permissions.
