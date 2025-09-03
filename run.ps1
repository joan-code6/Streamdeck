# PowerShell Run Script for ESP32 Streamdeck Project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ESP32 Streamdeck Monitor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host

Write-Host "Starting backend services..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python bluetooth_scanner.py" -WindowStyle Normal

Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Starting Electron app..." -ForegroundColor Yellow
Set-Location app
npm start

Write-Host "Application started!" -ForegroundColor Green
