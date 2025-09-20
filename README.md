# ESP32 Streamdeck Monitor

A modern Electron-based desktop application for monitoring GPIO states from ESP32 devices via Bluetooth Low Energy (BLE).

## 📁 Project Structure

```
streamdeck-project/
├── README.md              # This file
├── package.json           # Root workspace configuration
├── run.bat               # Quick start script for Windows
├── app/                  # Electron application (React + TypeScript + Vite)
│   ├── package.json
│   ├── electron/         # Electron main process
│   ├── src/             # React frontend source
│   └── dist/            # Built application
├── backend/             # Python BLE backend
│   ├── requirements.txt
│   ├── bluetooth_scanner.py
│   ├── volume_control.py
│   └── volume_config.json
├── firmware/            # ESP32 Arduino firmware
│   └── streamdeck.ino
└── assets/             # Shared project assets
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js 16+** and npm
2. **Python 3.11+**
3. **Arduino IDE** with ESP32 support and ArduinoJson library

### Installation & Setup

1. **Clone the repository:**
   ```powershell
   git clone https://github.com/joan-code6/Streamdeck/
   ```

2. **Run the setup script:**
   ```powershell
   .\setup.ps1
   ```

3. **Navigate to the project root (if not already there):**
   ```powershell
   cd ..
   ```

4. **Start the development environment:**
   ```powershell
   npm run dev
   ```


## 🛠️ Development

### Frontend (Electron App)
```bash
cd app
npm run dev          # Development with hot reload
npm run build        # Build for production
npm run electron:dev # Run electron in development
```

### Backend (Python)
```bash
cd backend
python bluetooth_scanner.py  # Start BLE scanner
```

### Firmware
- Located in `firmware/streamdeck.ino`
- Use Arduino IDE to modify and upload to ESP32
2. Install dependencies:
   ```bash
   npm install
   ```

### ESP32 Setup

1. Open `esp32-side/esp32-side.ino` in Arduino IDE
2. Install required libraries (ArduinoJson)
3. Change the `DEVICE_ID` for each device (e.g., "ESP32_001", "ESP32_002")
4. Upload the code to your ESP32
5. The device will advertise as "ESP32_Streamdeck_[DEVICE_ID]"

### Running the Application

```bash
# Install dependencies
npm install

# Run the desktop application
npm start
```
Or use the convenience script:
```bash
run.bat
```

### Option 2: Python Script Only
```bash
python main.py
```

## How It Works

### Continuous Monitoring
The system now runs continuously and:
- **Scans every 10 seconds** for new ESP32 devices
- **Maintains persistent connections** to all discovered devices
- **Automatically reconnects** if a device disconnects
- **Handles multiple devices** simultaneously
- **Never exits** unless manually stopped (Ctrl+C)

### Device Management
- **Auto-discovery**: Finds devices advertising as "ESP32_Streamdeck_[ID]"
- **Connection verification**: Sends verification on first connect
- **Keep-alive monitoring**: Regular heartbeat checks
- **GPIO state tracking**: Real-time updates of all 24 pins
- **Error recovery**: Automatic reconnection on failures

## Usage

1. **Start the Application**: Run `npm start`
2. **Automatic Operation**: The system will continuously scan and connect to devices
3. **Monitor GPIOs**: Watch real-time GPIO states with visual indicators
4. **View Logs**: Check the activity log for connection status and data
5. **Multi-Device**: Add more ESP32 devices with different DEVICE_IDs

## GPIO Pin Configuration

The ESP32 monitors these GPIO pins by default:
- GPIO 0-11, 13-19, 21-23, 25 (24 pins total)
- ADC pins (32-39) automatically read analog values
- Other pins read digital values

Modify the `gpioPins` array in the ESP32 code to change pin assignments.

## Architecture

- **ESP32**: Sends structured JSON data via BLE notifications
- **Python Script**: Handles BLE communication using bleak library
- **Electron App**: Provides beautiful UI and spawns Python process
- **Communication**: JSON-based protocol with verification and keep-alive

## Troubleshooting

### Python Process Exits Immediately
- **Problem**: Python script exits with code 0
- **Solution**: The script now runs continuously. If it exits, check:
  - BLE permissions (run as administrator on Windows)
  - bleak library installation: `pip install bleak`
  - ESP32 device is powered and advertising

### No Devices Found
- **Check**: ESP32 is powered on and BLE is enabled
- **Check**: Device name matches "ESP32_Streamdeck_*"
- **Check**: Bluetooth is enabled on host computer
- **Check**: No other BLE connections interfering
- **Note**: System scans every 10 seconds automatically

### Connection Issues
- **Problem**: Devices connect then disconnect
- **Solution**: Check ESP32 battery/power supply
- **Solution**: Reduce distance between devices
- **Solution**: Check for BLE interference
- **Note**: System automatically retries connections

### UI Not Updating
- **Problem**: Python output not reaching Electron
- **Solution**: Check Python process is running in Electron logs
- **Solution**: Restart the Electron application
- **Solution**: Check console for JavaScript errors

### Too Many Log Messages
- **Problem**: Keep-alive messages flooding logs
- **Solution**: Keep-alive messages are filtered out to reduce spam
- **Note**: Only important events are logged

### Multiple Devices Not Connecting
- **Problem**: Only one device connects
- **Solution**: Ensure each ESP32 has a unique DEVICE_ID
- **Solution**: Check Bluetooth adapter capacity
- **Note**: System supports multiple simultaneous connections

## Development

- Use `npm run dev` to run with DevTools open
- Modify `renderer.js` for UI changes
- Modify `main.py` for BLE communication logic
- Modify ESP32 code for hardware changes

## License

MIT License - feel free to use and modify!
