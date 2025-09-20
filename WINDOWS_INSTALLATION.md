# DIY Stream Deck - Windows Installation Guide

## Prerequisites

Before running the DIY Stream Deck application, you need to install Python 3.8 or higher on your Windows system.

### Installing Python

1. Download Python from the official website: https://python.org
2. Run the installer
3. **Important**: Check the box "Add Python to PATH" during installation
4. Complete the installation

### Verifying Python Installation

Open Command Prompt or PowerShell and run:
```cmd
python --version
```

You should see something like `Python 3.11.0` (version may vary).

## Installation

1. Download the `DIY Stream Deck Controller Setup 1.0.0.exe` installer
2. Run the installer as administrator
3. Follow the installation wizard
4. The application will be installed and shortcuts will be created on your desktop and in the Start menu

## First Time Setup

After installation, run the setup script to install Python dependencies:

1. Open the installation directory (usually `C:\Users\<YourName>\AppData\Local\Programs\diy-stream-deck-controller\`)
2. Run `setup_windows.bat` as administrator
3. The script will install all required Python packages

## Running the Application

- Use the desktop shortcut or Start menu entry to launch the application
- The app will automatically check for Python and show an error if it's not found
- Make sure your ESP32 Stream Deck devices are paired via Bluetooth

## Troubleshooting

### "Python Required" Error
- Install Python from https://python.org
- Make sure Python is added to your PATH
- Restart the application

### Backend Not Working
- Run `setup_windows.bat` again to ensure all dependencies are installed
- Check that your antivirus isn't blocking Python execution

### Bluetooth Issues
- Make sure your ESP32 devices are properly paired in Windows Bluetooth settings
- Try restarting the application

## Files Included

- `DIY Stream Deck Controller.exe` - Main application
- `setup_windows.bat` - Python dependency installer
- `backend/` - Python scripts for Bluetooth communication and device control
- `resources/` - Application resources

## System Requirements

- Windows 10 or higher
- Python 3.8+
- Bluetooth adapter (built-in or USB)
- Administrator privileges for installation

## Support

If you encounter issues, please check:
1. Python is properly installed and in PATH
2. All dependencies are installed via setup_windows.bat
3. Bluetooth is enabled and devices are paired
4. Antivirus software isn't blocking the application