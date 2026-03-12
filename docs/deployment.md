# Deployment Guide

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
