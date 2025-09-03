import asyncio
import bleak
from bleak import BleakScanner, BleakClient
import json
from datetime import datetime
import time

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
        has_gpio_data = device_data.get('has_gpio_data', True)  # Default to True for backward compatibility
        
        # Initialize device if not seen before
        if device_id not in devices:
            devices[device_id] = {
                'gpios': [0] * 16,  # Updated to 16 GPIOs
                'last_seen': datetime.now(),
                'verified': False
            }
            print(f"New device registered: {device_id}")
        
        # Update device data
        devices[device_id]['last_seen'] = datetime.now()
        
        if verify:
            devices[device_id]['verified'] = True
            print(f"✓ Device {device_id} verified connection")
        
        if keep_alive:
            if has_gpio_data and gpios:
                # Keep-alive with changes
                devices[device_id]['gpios'] = gpios
                print(f"♥ Keep-alive from {device_id} (with changes)")
                print(f"[{device_id}] GPIO States: {gpios}")
            else:
                # Keep-alive without changes
                print(f"♥ Keep-alive from {device_id}")
            return
        
        # Regular data update (only if has GPIO data)
        if has_gpio_data and gpios:
            devices[device_id]['gpios'] = gpios
            print(f"[{device_id}] GPIO States: {gpios}")
        
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
    """Connect to a device and maintain the connection"""
    device_name = "Unknown"
    
    while True:  # Keep trying to reconnect
        try:
            async with BleakClient(address) as client:
                print(f"Connected to {address}")
                
                # Get device name from advertisement if possible
                if hasattr(client, '_device_info'):
                    device_name = getattr(client._device_info, 'name', address)
                
                # Start notifications
                await client.start_notify(CHARACTERISTIC_UUID, notification_handler)
                
                print(f"Listening for GPIO data from {address}... (Ctrl+C to stop)")
                
                # Keep connection alive
                while True:
                    await asyncio.sleep(5)  # Check every 5 seconds
                    
                    # Check if device is still responsive
                    current_time = datetime.now()
                    for device_id, data in devices.items():
                        if (current_time - data['last_seen']).seconds > 30:
                            print(f"⚠ Device {device_id} seems unresponsive")
                            break
                            
        except Exception as e:
            print(f"Connection to {address} lost: {e}")
            print(f"Will retry connection in 5 seconds...")
            await asyncio.sleep(5)
            
        except asyncio.CancelledError:
            print(f"Connection to {address} cancelled")
            break

async def main():
    print("ESP32 BLE Monitor running continuously...")
    print("Press Ctrl+C to stop")

    connected_devices = {}
    scan_interval = 10  # Scan every 10 seconds
    last_scan = 0

    try:
        while True:
            current_time = time.time()

            # Periodic scanning for new devices
            if current_time - last_scan > scan_interval:
                print("Scanning for devices...")
                addresses = await find_esp32_devices()

                if addresses:
                    for address in addresses:
                        if address not in connected_devices:
                            print(f"New device found: {address}")
                            # Start connection task for new device
                            connected_devices[address] = asyncio.create_task(connect_and_read(address))
                else:
                    print("No devices found, will retry in", scan_interval, "seconds")

                last_scan = current_time

            # Clean up completed tasks
            completed_tasks = [addr for addr, task in connected_devices.items() if task.done()]
            for addr in completed_tasks:
                print(f"Connection to {addr} ended")
                del connected_devices[addr]

            await asyncio.sleep(1)

    except KeyboardInterrupt:
        print("Stopping all connections...")
        for task in connected_devices.values():
            task.cancel()
        await asyncio.gather(*connected_devices.values(), return_exceptions=True)
        print("All connections stopped")

if __name__ == "__main__":
    asyncio.run(main())
