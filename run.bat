@echo off
echo ========================================
echo ESP32 Streamdeck Monitor
echo ========================================
echo.
echo Starting backend services...
start "Backend" cmd /k "cd backend && python bluetooth_scanner.py"
timeout /t 2 /nobreak >nul
echo.
echo Starting Electron app...
cd app
npm start
