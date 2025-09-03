import sys
import json
import os

def load_device_config(device_id):
    """Load configuration for a specific device"""
    config_dir = os.path.join(os.path.dirname(__file__), '..', 'configs')
    config_file = os.path.join(config_dir, f'{device_id}.json')
    
    # Create config directory if it doesn't exist
    os.makedirs(config_dir, exist_ok=True)
    
    # Default configuration
    default_config = {
        "id": device_id,
        "name": f"ESP32 Stream Deck {device_id[-6:]}",
        "gpios": {
            "d2": {"type": "button", "label": "Button 1", "action": ""},
            "d4": {"type": "button", "label": "Button 2", "action": ""},
            "d5": {"type": "button", "label": "Button 3", "action": ""},
            "d12": {"type": "button", "label": "Button 4", "action": ""},
            "d13": {"type": "button", "label": "Button 5", "action": ""},
            "d14": {"type": "button", "label": "Button 6", "action": ""},
            "d15": {"type": "rotary", "label": "Volume", "action": "volume"},
            "d16": {"type": "button", "label": "Button 7", "action": ""},
            "d17": {"type": "button", "label": "Button 8", "action": ""},
            "d18": {"type": "button", "label": "Button 9", "action": ""},
            "d19": {"type": "button", "label": "Button 10", "action": ""},
            "d21": {"type": "button", "label": "Button 11", "action": ""},
            "d25": {"type": "button", "label": "Button 12", "action": ""},
            "d26": {"type": "button", "label": "Button 13", "action": ""},
            "d27": {"type": "button", "label": "Button 14", "action": ""},
            "d33": {"type": "button", "label": "Button 15", "action": ""}
        },
        "volumeGpio": "d15"
    }
    
    try:
        # Try to load existing config
        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
                # Merge with defaults to ensure all required fields exist
                for key in default_config:
                    if key not in config:
                        config[key] = default_config[key]
                return config
        else:
            # Create default config file
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=2)
            return default_config
            
    except Exception as e:
        # Return default config if there's any error
        return default_config

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: load_config.py <device_id>"}))
        sys.exit(1)
    
    device_id = sys.argv[1]
    config = load_device_config(device_id)
    print(json.dumps(config))