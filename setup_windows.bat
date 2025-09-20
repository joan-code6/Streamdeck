@echo off
echo ========================================
echo   DIY Stream Deck - Setup Script
echo ========================================
echo.
echo This script will help you set up the DIY Stream Deck application.
echo It will install Python and required dependencies if needed.
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH.
    echo.
    echo Please download and install Python from: https://python.org
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    echo After installing Python, run this script again.
    pause
    exit /b 1
)

echo Python is installed. Checking version...
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set python_version=%%i
echo Python version: %python_version%

REM Install required Python packages
echo.
echo Installing required Python packages...
cd backend
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo Failed to install Python packages.
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo Setup completed successfully!
echo.
echo You can now run the DIY Stream Deck application.
echo The installer should be in the 'app/release' folder after building.
echo.
pause