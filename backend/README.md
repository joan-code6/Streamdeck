# ESP32 Streamdeck Backend

This folder contains the Python backend services for communicating with ESP32 devices via Bluetooth Low Energy (BLE).

## Files

- `bluetooth_scanner.py` - Main BLE scanner and device manager
- `volume_control.py` - Windows volume control integration
- `volume_config.json` - Volume control configuration
- `hotkey.py` - Hotkey execution system for running keyboard shortcuts
- `hotkey_executor.py` - CLI wrapper for executing individual hotkeys
- `gpio_action_handler.py` - GPIO action handler for executing configured actions
- `requirements.txt` - Python dependencies

## Setup

```bash
pip install -r requirements.txt
```

## Usage

### Bluetooth Scanner
```bash
python bluetooth_scanner.py
```

The backend will start scanning for ESP32 devices and handle all BLE communication with the Electron frontend.

### Hotkey System
The `hotkey.py` module provides a class for executing keyboard shortcuts from string input. This is now integrated into the Electron app for button mapping.

```python
from hotkey import HotkeyRunner, run_hotkey

# Using the class
hotkey_runner = HotkeyRunner()
hotkey_runner.run_hotkey('shift + b')
hotkey_runner.run_hotkey('ctrl + space')

# Using the convenience function
run_hotkey('shift + b')
run_hotkey('ctrl + space')
```

#### CLI Usage
You can also execute hotkeys directly from the command line:

```bash
# Execute a single hotkey
python hotkey_executor.py "ctrl + c"

# Execute with custom hold duration
python hotkey_executor.py "shift + tab" 0.2
```

#### GPIO Action Handler
The `gpio_action_handler.py` script handles execution of configured actions when GPIO buttons are pressed:

```bash
# Execute action for specific device and GPIO
python gpio_action_handler.py <device_id> <gpio_pin>
```

#### Supported Key Formats:
- **Modifier keys**: `ctrl`, `shift`, `alt`, `win`/`cmd`
- **Special keys**: `space`, `enter`, `tab`, `esc`, `delete`, arrow keys, function keys (f1-f12)
- **Regular characters**: Any letter or number
- **Case insensitive**: Works with both `'Shift + B'` and `'shift + b'`

#### Example Hotkeys:
```python
run_hotkey('ctrl + c')        # Copy
run_hotkey('ctrl + v')        # Paste
run_hotkey('alt + tab')       # Switch applications
run_hotkey('win + d')         # Show desktop
run_hotkey('f11')             # Fullscreen toggle
run_hotkey('ctrl + shift + n') # Multiple modifiers
```

### Integration with Electron App

The hotkey system is now fully integrated into the Electron application:

1. **Button Configuration**: In the "Manage Device" page, users can select "Hotkey-Kombination" as an action type
2. **Predefined Hotkeys**: Common hotkey combinations are available as presets (Ctrl+C, Alt+Tab, etc.)
3. **Custom Hotkeys**: Users can enter custom hotkey combinations using the supported format
4. **Real-time Testing**: Hotkeys can be tested immediately from the configuration interface
5. **Hold Duration**: Configurable hold duration for each hotkey (0.1-2.0 seconds)

The Electron app communicates with the Python backend via IPC to execute hotkeys when Stream Deck buttons are pressed.
