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
            "d2": {"type": "key", "action": ""},
            "d4": {"type": "key", "action": ""},
            "d5": {"type": "key", "action": ""},
            "d12": {"type": "key", "action": ""},
            "d13": {"type": "key", "action": ""},
            "d14": {"type": "key", "action": ""},
            "d15": {"type": "custom", "action": "volume"},
            "d16": {"type": "key", "action": ""},
            "d17": {"type": "key", "action": ""},
            "d18": {"type": "key", "action": ""},
            "d19": {"type": "key", "action": ""},
            "d21": {"type": "key", "action": ""},
            "d25": {"type": "key", "action": ""},
            "d26": {"type": "key", "action": ""},
            "d27": {"type": "key", "action": ""},
            "d33": {"type": "key", "action": ""}
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
                
                # Fix invalid action types in existing configs
                for gpio, gpio_config in config.get('gpios', {}).items():
                    if gpio_config.get('type') == 'button':
                        gpio_config['type'] = 'key'
                    if gpio_config.get('type') == 'rotary':
                        gpio_config['type'] = 'custom'
                
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