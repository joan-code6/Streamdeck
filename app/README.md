# DIY Stream Deck - ESP32 Bluetooth GPIO Monitor

## Overview
This is a real-time GPIO monitoring system for ESP32 devices with Bluetooth Low Energy (BLE) communication and an Electron desktop interface.

## Features
- 🔷 **Real-time GPIO Monitoring**: Monitor 16 GPIO pins simultaneously
- 🎛️ **Rotary Encoder Support**: Special handling for D15 as analog rotary encoder with percentage display
- 📡 **BLE Communication**: Wireless connection to ESP32 devices
- 🖥️ **Modern UI**: Electron desktop app with React and Tailwind CSS
- ⚙️ **Device Configuration**: Save and load custom GPIO configurations
- 🔄 **Change Detection**: Optimized transmission - only sends changes
- 🎨 **Visual Feedback**: Color-coded GPIO states and rotary encoder visualization

## ESP32 GPIO Configuration
The system monitors these 16 GPIO pins:
- **D15**: Rotary encoder (analog input, 0-4095 range)
- **D2, D4, D5, D12, D13, D14, D16, D17, D18, D19, D21, D25, D26, D27, D33**: Digital/analog inputs

### Rotary Encoder Sensitivity
- **D15**: Only updates when value changes by >100 units (reduces noise)
- **Other analog pins**: Update when value changes by >10 units
- **Digital pins**: Update on any state change

## Setup Instructions

### 1. ESP32 Setup
1. Install the Arduino IDE
2. Install the ESP32 board package
3. Install the ArduinoJson library
4. Upload `esp32-side/esp32-side.ino` to your ESP32
5. Wire your rotary encoder to D15 and buttons to other GPIO pins

### 2. Desktop App Setup
1. Install Python 3.7+ and Node.js 16+
2. Run the setup script:
   ```bash
   cd web
   ./setup.bat  # Windows
   ```
   Or manually:
   ```bash
   cd web/scripts
   pip install -r requirements.txt
   cd ..
   npm install
   npm run build
   ```

### 3. Running the Application
```bash
cd web
npm run electron:dev
```

## Usage

### First Time Setup
1. Start the desktop application
2. Power on your ESP32 device
3. The app will automatically scan and connect to ESP32 devices
4. Watch real-time GPIO updates in the dashboard

### Monitoring GPIO States
- **Digital pins**: Show HIGH/LOW states with green/gray colors
- **D15 (Rotary encoder)**: Shows percentage (0-100%) with purple gradient
- **Device status**: Green = connected, Red = disconnected
- **Connection timeout**: 15 seconds of inactivity

### Device Configuration
- Click on any device to select it
- GPIO configurations are automatically saved per device
- Configurations persist between sessions

## File Structure
```
web/
├── electron/           # Electron main process
├── scripts/           # Python BLE scripts
├── src/              # React frontend
├── configs/          # Device configurations (auto-generated)
└── package.json      # Dependencies and build scripts

esp32-side/
└── esp32-side.ino    # ESP32 Arduino code
```

## BLE Communication Protocol
The system uses JSON messages over BLE:

### ESP32 → Desktop
```json
{
  "device_name": "ESP32-StreamDeck",
  "gpio_states": [0, 1, 0, 2048, ...], // 16 values
  "has_gpio_data": true,
  "timestamp": 1234567890
}
```

### Keep-alive messages
```json
{
  "device_name": "ESP32-StreamDeck", 
  "has_gpio_data": false,
  "timestamp": 1234567890
}
```

## Development

### Building for Distribution
```bash
npm run electron:build
```

### Development Mode
```bash
npm run electron:dev
```

### Python Script Testing
```bash
cd scripts
python bluetooth_scanner.py
```

## Troubleshooting

### ESP32 Not Detected
- Ensure ESP32 is powered and running the correct firmware
- Check if BLE is enabled on your computer
- Restart the desktop application

### Connection Issues
- ESP32 devices timeout after 15 seconds of inactivity
- Check serial monitor on ESP32 for error messages
- Verify ArduinoJson library is installed

### Rotary Encoder Not Working
- Ensure rotary encoder is connected to D15
- Check wiring: middle pin to D15, outer pins to GND and 3.3V
- Verify the 100-unit sensitivity threshold is appropriate

## Hardware Wiring

### Rotary Encoder (D15)
```
Rotary Encoder:
├── Pin 1 (GND) → ESP32 GND
├── Pin 2 (Signal) → ESP32 D15  
└── Pin 3 (VCC) → ESP32 3.3V
```

### Buttons (Other GPIO pins)
```
Button:
├── One side → GPIO pin (D2, D4, etc.)
└── Other side → GND
```

## Credits
Built with ESP32, Arduino, Python (bleak), Electron, React, and Tailwind CSS.
