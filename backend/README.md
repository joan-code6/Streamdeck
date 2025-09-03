# ESP32 Streamdeck Backend

This folder contains the Python backend services for communicating with ESP32 devices via Bluetooth Low Energy (BLE).

## Files

- `bluetooth_scanner.py` - Main BLE scanner and device manager
- `volume_control.py` - Windows volume control integration
- `volume_config.json` - Volume control configuration
- `requirements.txt` - Python dependencies

## Setup

```bash
pip install -r requirements.txt
```

## Usage

```bash
python bluetooth_scanner.py
```

The backend will start scanning for ESP32 devices and handle all BLE communication with the Electron frontend.
