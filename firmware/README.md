# ESP32 Streamdeck Firmware

Arduino firmware for ESP32 to act as a Streamdeck device with GPIO monitoring and BLE communication.

## Setup

1. Open `streamdeck.ino` in Arduino IDE
2. Install required libraries:
   - ArduinoJson (via Library Manager)
3. Select your ESP32 board (ESP32 Dev Module recommended)
4. Upload the firmware

## Features

- BLE communication with desktop app
- GPIO state monitoring (digital and analog)
- Multi-device support
- Real-time data transmission

## Configuration

Modify the GPIO pins and other settings directly in the `streamdeck.ino` file before uploading.
