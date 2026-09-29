# 🚀 Deployment Guide — NexGuard Secure Wallet

---

## 1. Quick Local Development (Windows)

The simplest way to run both backend and frontend simultaneously:

```cmd
start.bat
```

This launches:
- **Backend:** `http://localhost:8000` (FastAPI, SQLite, 10 Agents)
- **Frontend:** `http://localhost:3000` (Next.js 16 App Router)

---

## 2. Manual Development Setup

### Terminal 1: Backend
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```

---

## 3. Docker Compose Production Deployment

To run a production-ready stack with dedicated PostgreSQL 16:

```powershell
docker-compose up --build -d
```

### Checking Services
```powershell
docker-compose ps
docker-compose logs -f backend
```

### Database Persistence
PostgreSQL data is stored in the Docker volume `pgdata`. To reset database state:
```powershell
docker-compose down -v
```

---

## 4. Production Security Checklist

1. **Environment Variables:** Change `SECRET_KEY` in `.env` to a random 64-character string.
2. **Database:** Switch `DATABASE_URL` from SQLite to PostgreSQL.
3. **CORS:** Restrict `CORS_ORIGINS` to your registered domain names instead of wildcard `*`.
4. **TLS:** Terminate SSL/TLS with reverse proxy (Nginx or Caddy) using modern cipher suites and PQC hybrid key encapsulation (Kyber-1024).
