import asyncio
from bleak import BleakScanner

async def simple_scan():
    print("Starting simple BLE scan...")
    devices = await BleakScanner.discover(timeout=10.0)
    
    print(f"Found {len(devices)} devices:")
    for device in devices:
        rssi = getattr(device, 'rssi', 'N/A')
        print(f"  - {device.name or 'Unknown'} ({device.address}) RSSI: {rssi}")
        if device.name and "ESP32" in device.name:
            print(f"    >>> ESP32 DETECTED! <<<")
        elif device.name and "Streamdeck" in device.name:
            print(f"    >>> STREAMDECK DETECTED! <<<")

if __name__ == "__main__":
    asyncio.run(simple_scan())
