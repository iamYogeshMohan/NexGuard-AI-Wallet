@echo off
title NexGuard Secure Wallet - Launcher
color 0b

echo ========================================================
echo        NEXGUARD SECURE WALLET - MULTI-AGENT SECURITY
echo   "Don't build a wallet that simply moves money.
echo    Build a wallet that understands trust first."
echo ========================================================
echo.

:: 1. Start Backend FastAPI Engine
echo [1/2] Launching Backend FastAPI Engine on Port 8000...
cd /d "%~dp0backend"
if exist "venv\Scripts\activate.bat" (
    start "NexGuard Backend" cmd /k "venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
) else (
    start "NexGuard Backend" cmd /k "uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
)

:: 2. Start Frontend Next.js Platform
echo [2/2] Launching Frontend Next.js Platform on Port 3000...
cd /d "%~dp0frontend"
start "NexGuard Frontend" cmd /k "npm run dev"

echo.
echo ========================================================
echo All NexGuard services successfully launched!
echo.
echo  - Portal Gateway:     http://localhost:3000
echo  - Mobile Wallet:      http://localhost:3000/mobile/dashboard
echo  - Bank SOC Console:   http://localhost:3000/soc
echo  - Attack Lab (Viva):  http://localhost:3000/demo
echo  - Backend API Docs:   http://localhost:8000/docs
echo  - System Health:      http://localhost:8000/api/health
echo ========================================================
echo.
echo Multi-Device LAN Note:
echo To access from your phone on the same Wi-Fi, run 'ipconfig'
echo and open: http://<YOUR-LAPTOP-IP>:3000/mobile/dashboard
echo ========================================================
pause
