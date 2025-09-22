#!/usr/bin/env python3
"""
Hotkey executor for Stream Deck backend.
This script handles hotkey execution requests from the Electron app.
"""

import sys
import json
from hotkey import run_hotkey

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No hotkey string provided"}))
        sys.exit(1)
    
    hotkey_string = sys.argv[1]
    hold_duration_str = sys.argv[2] if len(sys.argv) > 2 else "0.1"
    
    try:
        hold_duration = float(hold_duration_str)
        # Ensure hold_duration is reasonable (between 0.01 and 1.0 seconds)
        hold_duration = max(0.01, min(1.0, hold_duration))
    except (ValueError, TypeError):
        hold_duration = 0.1
    
    try:
        run_hotkey(hotkey_string, hold_duration)
        print(json.dumps({"success": True, "hotkey": hotkey_string, "hold_duration": hold_duration}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "hotkey": hotkey_string}))
        sys.exit(1)

if __name__ == "__main__":
    main()
