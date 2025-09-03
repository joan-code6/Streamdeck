import sys
import json
import os

def save_device_config(device_id, config_data):
    """Save configuration for a specific device"""
    try:
        config_dir = os.path.join(os.path.dirname(__file__), '..', 'configs')
        config_file = os.path.join(config_dir, f'{device_id}.json')
        
        # Create config directory if it doesn't exist
        os.makedirs(config_dir, exist_ok=True)
        
        # Parse config data if it's a string
        if isinstance(config_data, str):
            config_data = json.loads(config_data)
        
        # Save the config
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2)
        
        return {"success": True, "message": f"Configuration saved for device {device_id}"}
        
    except json.JSONDecodeError as e:
        return {"success": False, "error": f"Invalid JSON format: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to save configuration: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"success": False, "error": "Usage: save_config.py <device_id> <config_json>"}))
        sys.exit(1)
    
    device_id = sys.argv[1]
    config_json = sys.argv[2]
    
    result = save_device_config(device_id, config_json)
    print(json.dumps(result))