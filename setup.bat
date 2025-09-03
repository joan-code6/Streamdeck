@echo off
echo ========================================
echo ESP32 Streamdeck Project Setup
echo ========================================
echo.

echo Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo Error installing root dependencies
    pause
    exit /b 1
)

echo.
echo Installing app dependencies...
cd app
call npm install
if errorlevel 1 (
    echo Error installing app dependencies
    pause
    exit /b 1
)

cd ..
echo.
echo Installing Python dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo Error installing Python dependencies
    echo Make sure Python and pip are installed and available in PATH
    pause
    exit /b 1
)

cd ..
echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the application:
echo   1. Run 'run.bat' for quick start
echo   2. Or use 'npm start' from project root
echo   3. Or use 'npm run dev' for development mode
echo.
pause
