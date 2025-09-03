# PowerShell Setup Script for ESP32 Streamdeck Project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ESP32 Streamdeck Project Setup" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host

Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing root dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host
Write-Host "Installing app dependencies..." -ForegroundColor Yellow
Set-Location app
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing app dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location ..
Write-Host
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
Set-Location backend
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing Python dependencies" -ForegroundColor Red
    Write-Host "Make sure Python and pip are installed and available in PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location ..
Write-Host
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host "  1. Run '.\run.bat' for quick start" -ForegroundColor White
Write-Host "  2. Or use 'npm start' from project root" -ForegroundColor White
Write-Host "  3. Or use 'npm run dev' for development mode" -ForegroundColor White
Write-Host
Read-Host "Press Enter to continue"
