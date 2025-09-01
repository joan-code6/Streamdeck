import asyncio
import bleak
from bleak import BleakScanner, BleakClient
import json
from datetime import datetime

SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"

# Store device data
devices = {}

def notification_handler(sender, data):
    """Handle notifications from the BLE device"""
    try:
        # Decode the data
        json_str = data.decode('utf-8')
        device_data = json.loads(json_str)
        
        device_id = device_data.get('device_id', 'unknown')
        timestamp = device_data.get('timestamp', 0)
        gpios = device_data.get('gpios', [])
        verify = device_data.get('verify', False)
        keep_alive = device_data.get('keep_alive', False)
        
        # Initialize device if not seen before
        if device_id not in devices:
            devices[device_id] = {
                'gpios': [0] * 24,
                'last_seen': datetime.now(),
                'verified': False
            }
        
        # Update device data
        devices[device_id]['gpios'] = gpios
        devices[device_id]['last_seen'] = datetime.now()
        
        if verify:
            devices[device_id]['verified'] = True
            print(f"✓ Device {device_id} verified connection")
        
        if keep_alive:
            print(f"♥ Keep-alive from {device_id}")
            return  # Don't print GPIO data for keep-alive
        
        # Print GPIO states
        print(f"[{device_id}] GPIO States: {gpios}")
        
        # You can add logic here to process specific GPIO changes
        # For example, trigger actions when certain pins change
        
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}")
    except Exception as e:
        print(f"Error handling notification: {e}")

async def find_esp32_devices():
    print("Scanning for ESP32 BLE devices...")
    devices_found = []
    devices_list = await BleakScanner.discover()
    
    for device in devices_list:
        if device.name and "ESP32_Streamdeck" in device.name:
            print(f"Found device: {device.name} at {device.address}")
            devices_found.append(device.address)
    
    return devices_found

async def connect_and_read(address):
    try:
        async with BleakClient(address) as client:
            print(f"Connected to {address}")
            
            # Start notifications
            await client.start_notify(CHARACTERISTIC_UUID, notification_handler)
            
            print("Listening for GPIO data... Press Ctrl+C to stop")
            
            try:
                while True:
                    await asyncio.sleep(1)
                    
                    # Check for stale devices
                    current_time = datetime.now()
                    for device_id, data in devices.items():
                        if (current_time - data['last_seen']).seconds > 10:
                            print(f"⚠ Device {device_id} seems disconnected")
                            
            except KeyboardInterrupt:
                print("Stopping...")
            finally:
                await client.stop_notify(CHARACTERISTIC_UUID)
                
    except Exception as e:
        print(f"Connection error: {e}")

async def main():
    addresses = await find_esp32_devices()
    
    if addresses:
        # For now, connect to the first device found
        # You can modify this to connect to multiple devices
        await connect_and_read(addresses[0])
    else:
        print("No ESP32 Streamdeck devices found. Make sure they're powered on and BLE is enabled.")

if __name__ == "__main__":
    asyncio.run(main())
