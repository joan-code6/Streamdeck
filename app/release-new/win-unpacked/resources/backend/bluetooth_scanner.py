import asyncio
import json
import sys
from bleak import BleakScanner, BleakClient
import time
import signal
import logging
import uuid
import os
import subprocess

# Configure logging
logging.basicConfig(level=logging.WARNING)

# Global variables for device management
connected_devices = {}
device_timeouts = {}
device_gpio_states = {}  # Track previous GPIO states for button press detection
client_uuid = str(uuid.uuid4())  # Generate unique client UUID

# GPIO pin mapping (adjust based on your ESP32 setup)
GPIO_PIN_MAP = {
    0: "d2", 1: "d4", 2: "d5", 3: "d12", 4: "d13", 5: "d14",
    6: "d15", 7: "d16", 8: "d17", 9: "d18", 10: "d19", 
    11: "d21", 12: "d25", 13: "d26", 14: "d27", 15: "d33"
}

# Service and characteristic UUIDs (must match ESP32)
SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"

class DeviceManager:
    def __init__(self):
        self.devices = {}
        self.clients = {}
        self.client_uuid = client_uuid
        print(json.dumps({"debug": f"Client UUID: {self.client_uuid}"}))
        
    async def notification_handler(self, sender, data):
        """Handle incoming BLE notifications"""
        try:
            message = data.decode('utf-8')
            data_obj = json.loads(message)
            
            # Get device address from the sender characteristic
            device_address = None
            for addr, client in self.clients.items():
                if client.is_connected:
                    device_address = addr
                    break
            
            if device_address:
                # Update device timeout
                device_timeouts[device_address] = time.time()
                
                # Handle pairing confirmation
                if data_obj.get('action') == 'pair_confirm':
                    print(json.dumps({
                        "debug": f"Pairing confirmed with {device_address}",
                        "device_uuid": data_obj.get('device_uuid'),
                        "status": data_obj.get('status')
                    }))
                    return
                
                # Process GPIO data
                if 'gpio_states' in data_obj:
                    current_gpio_states = data_obj.get('gpio_states', [])
                    
                    # Check for button presses (0 -> 1 transitions)
                    if device_address in device_gpio_states:
                        previous_states = device_gpio_states[device_address]
                        
                        # Compare current and previous states to detect button presses
                        for i, (current, previous) in enumerate(zip(current_gpio_states, previous_states)):
                            if current == 1 and previous == 0:  # Button press detected
                                gpio_pin = GPIO_PIN_MAP.get(i)
                                if gpio_pin:
                                    # Execute action for this GPIO pin
                                    asyncio.create_task(self.execute_gpio_action(device_address, gpio_pin))
                    
                    # Update stored GPIO states
                    device_gpio_states[device_address] = current_gpio_states.copy()
                    
                    # Create device info in expected format
                    device_info = {
                        "address": device_address,
                        "name": f"ESP32-{device_address[-5:]}",
                        "gpio_states": current_gpio_states,
                        "timestamp": time.time(),
                        "connected": True
                    }
                    
                    # Output the device update
                    print(json.dumps(device_info))
                    sys.stdout.flush()
                    
        except Exception as e:
            print(json.dumps({"error": f"Notification error: {str(e)}"}))
            sys.stdout.flush()

    async def execute_gpio_action(self, device_address, gpio_pin):
        """Execute action for GPIO button press"""
        try:
            # Convert device address to device ID (replace colons with dashes)
            device_id = device_address.replace(':', '-').lower()
            
            # Execute GPIO action handler
            script_path = os.path.join(os.path.dirname(__file__), 'gpio_action_handler.py')
            
            # Run the GPIO action handler in a subprocess
            process = subprocess.Popen(
                ['python', script_path, device_id, gpio_pin],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=os.path.dirname(__file__)
            )
            
            stdout, stderr = process.communicate(timeout=5)  # 5 second timeout
            
            if process.returncode == 0:
                try:
                    result = json.loads(stdout)
                    print(json.dumps({
                        "debug": f"GPIO {gpio_pin} action executed",
                        "device": device_id,
                        "result": result
                    }))
                except json.JSONDecodeError:
                    print(json.dumps({
                        "debug": f"GPIO {gpio_pin} action executed (non-JSON response)",
                        "device": device_id,
                        "output": stdout
                    }))
            else:
                print(json.dumps({
                    "error": f"GPIO action failed for {gpio_pin}",
                    "device": device_id,
                    "stderr": stderr
                }))
            
            sys.stdout.flush()
            
        except subprocess.TimeoutExpired:
            print(json.dumps({
                "error": f"GPIO action timeout for {gpio_pin}",
                "device": device_address
            }))
            sys.stdout.flush()
        except Exception as e:
            print(json.dumps({
                "error": f"GPIO action error: {str(e)}",
                "device": device_address,
                "gpio": gpio_pin
            }))
            sys.stdout.flush()

    async def connect_device(self, device):
        """Connect to a BLE device"""
        try:
            client = BleakClient(device.address)
            await client.connect()
            
            # Store client reference
            self.clients[device.address] = client
            device_timeouts[device.address] = time.time()
            
            # Start notifications
            await client.start_notify(CHARACTERISTIC_UUID, self.notification_handler)
            
            # Send pairing request
            pairing_data = {
                "action": "pair",
                "client_uuid": self.client_uuid
            }
            await client.write_gatt_char(CHARACTERISTIC_UUID, json.dumps(pairing_data).encode())
            
            print(json.dumps({
                "event": "device_connected",
                "address": device.address,
                "name": device.name or f'ESP32-{device.address[-5:]}'
            }))
            sys.stdout.flush()
            
            # Wait a bit for pairing response
            await asyncio.sleep(0.5)
            
            # Send connect request
            connect_data = {
                "action": "connect",
                "client_uuid": self.client_uuid
            }
            await client.write_gatt_char(CHARACTERISTIC_UUID, json.dumps(connect_data).encode())
            
            return client
            
        except Exception as e:
            print(json.dumps({
                "error": f"Connection failed for {device.address}: {str(e)}"
            }))
            sys.stdout.flush()
            return None

    async def check_timeouts(self):
        """Check for device timeouts and cleanup"""
        current_time = time.time()
        disconnected_devices = []
        
        for address, last_seen in list(device_timeouts.items()):
            if current_time - last_seen > 15:  # 15 second timeout
                disconnected_devices.append(address)
                
        for address in disconnected_devices:
            try:
                if address in self.clients:
                    await self.clients[address].disconnect()
                    del self.clients[address]
                del device_timeouts[address]
                
                print(json.dumps({
                    "event": "device_disconnected", 
                    "address": address
                }))
                sys.stdout.flush()
                
            except Exception as e:
                print(json.dumps({"error": f"Cleanup error: {str(e)}"}))
                sys.stdout.flush()

    async def scan_and_manage(self):
        """Main scanning and device management loop"""
        while True:
            try:
                # Scan for devices
                print(json.dumps({"debug": "Starting BLE scan..."}))
                sys.stdout.flush()
                
                devices = await BleakScanner.discover(timeout=5.0)
                print(json.dumps({"debug": f"Found {len(devices)} devices"}))
                sys.stdout.flush()
                
                for device in devices:
                    # Debug: Print all discovered devices
                    print(json.dumps({
                        "debug": f"Device found: {device.name} ({device.address})"
                    }))
                    sys.stdout.flush()
                    
                    # Look for our ESP32 devices - be more specific
                    if device.name and ("ESP32_Streamdeck" in device.name or "ESP32" in device.name):
                        print(json.dumps({
                            "debug": f"ESP32 device detected: {device.name} ({device.address})"
                        }))
                        sys.stdout.flush()
                        
                        # Try to connect if not already connected
                        if device.address not in self.clients:
                            await self.connect_device(device)
                
                # Check for timeouts
                await self.check_timeouts()
                
                # Short delay before next scan
                await asyncio.sleep(2)
                
            except Exception as e:
                print(json.dumps({"error": f"Scan error: {str(e)}"}))
                sys.stdout.flush()
                await asyncio.sleep(5)

async def main():
    device_manager = DeviceManager()
    
    # Handle graceful shutdown
    def signal_handler(signum, frame):
        print(json.dumps({"event": "shutdown"}))
        sys.stdout.flush()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start the main loop
    await device_manager.scan_and_manage()

if __name__ == "__main__":
    asyncio.run(main())