#!/usr/bin/env python3
"""
GPIO Action Handler for Stream Deck backend.
This script handles action execution based on GPIO button presses.
"""

import sys
import json
import os
from hotkey import run_hotkey

def load_device_config(device_id):
    """Load device configuration from file"""
    config_path = os.path.join(os.path.dirname(__file__), '..', 'configs', f'{device_id}.json')
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}

def execute_action(action_config):
    """Execute an action based on its configuration"""
    action_type = action_config.get('type', 'key')
    action_value = action_config.get('action', '')
    hold_duration = action_config.get('holdDuration', 0.1)
    
    if not action_value:
        return {"success": False, "error": "No action specified"}
    
    try:
        if action_type == 'hotkey':
            # Execute hotkey combination
            run_hotkey(action_value, hold_duration)
            return {"success": True, "action": f"hotkey: {action_value}"}
        
        elif action_type == 'key':
            # Simple key press (convert to hotkey format if needed)
            if '+' not in action_value:
                # Single key
                run_hotkey(action_value, hold_duration)
            else:
                # Key combination (likely already in hotkey format)
                run_hotkey(action_value, hold_duration)
            return {"success": True, "action": f"key: {action_value}"}
        
        elif action_type == 'multimedia':
            # Convert multimedia actions to hotkeys
            multimedia_map = {
                'play_pause': 'space',  # or use media keys if available
                'next_track': 'ctrl + right',
                'prev_track': 'ctrl + left',
                'volume_up': 'ctrl + up',
                'volume_down': 'ctrl + down',
                'mute': 'ctrl + m'
            }
            hotkey = multimedia_map.get(action_value, action_value)
            run_hotkey(hotkey, hold_duration)
            return {"success": True, "action": f"multimedia: {action_value}"}
        
        elif action_type == 'system':
            # Convert system actions to hotkeys
            system_map = {
                'screenshot': 'win + shift + s',
                'sleep': 'win + x, u, s',  # Sleep via Win+X menu
                'lock': 'win + l'
            }
            hotkey = system_map.get(action_value, action_value)
            run_hotkey(hotkey, hold_duration)
            return {"success": True, "action": f"system: {action_value}"}
        
        elif action_type == 'custom':
            # Treat custom actions as hotkey combinations
            run_hotkey(action_value, hold_duration)
            return {"success": True, "action": f"custom: {action_value}"}
        
        else:
            return {"success": False, "error": f"Unknown action type: {action_type}"}
    
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: gpio_action_handler.py <device_id> <gpio_pin>"}))
        sys.exit(1)
    
    device_id = sys.argv[1]
    gpio_pin = sys.argv[2]
    
    # Load device configuration
    config = load_device_config(device_id)
    
    # Get GPIO configuration
    gpio_config = config.get('gpios', {}).get(gpio_pin)
    
    if not gpio_config:
        print(json.dumps({"success": False, "error": f"No configuration found for GPIO {gpio_pin}"}))
        sys.exit(1)
    
    # Execute the action
    result = execute_action(gpio_config)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
