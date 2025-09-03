@echo off
echo Installing Python requirements...
cd scripts
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error installing Python requirements
    pause
    exit /b 1
)

echo.
echo Installing Node.js dependencies...
cd ..
npm install
if %errorlevel% neq 0 (
    echo Error installing Node.js dependencies
    pause
    exit /b 1
)

echo.
echo Building the application...
npm run build
if %errorlevel% neq 0 (
    echo Error building the application
    pause
    exit /b 1
)

echo.
echo Setup complete! You can now run the application with:
echo npm run electron:dev
echo.
pause
