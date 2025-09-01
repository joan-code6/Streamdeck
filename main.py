import serial
import time

# Change this to your ESP32's COM port (e.g., 'COM5')
COM_PORT = 'COM10'
BAUD_RATE = 115200

try:
    ser = serial.Serial(COM_PORT, BAUD_RATE, timeout=1)
    print(f"Connected to {COM_PORT} at {BAUD_RATE} baud.")
except serial.SerialException as e:
    print(f"Could not open serial port: {e}")
    exit(1)

try:
    while True:
        if ser.in_waiting:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            print(f"Received: {line}")
        time.sleep(0.1)
except KeyboardInterrupt:
    print("Exiting...")
finally:
    ser.close()
