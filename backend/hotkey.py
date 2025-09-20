import time
from pynput.keyboard import Key, Controller
from typing import List, Union


class HotkeyRunner:
    """
    A class to run hotkeys based on string input.
    
    Example usage:
        hotkey_runner = HotkeyRunner()
        hotkey_runner.run_hotkey('shift + b')
        hotkey_runner.run_hotkey('ctrl + space')
    """
    
    def __init__(self):
        self.keyboard = Controller()
        
        # Map string representations to pynput Key objects
        self.key_mapping = {
            # Modifier keys
            'ctrl': Key.ctrl,
            'control': Key.ctrl,
            'shift': Key.shift,
            'alt': Key.alt,
            'cmd': Key.cmd,
            'win': Key.cmd,
            'windows': Key.cmd,
            
            # Special keys
            'space': Key.space,
            'enter': Key.enter,
            'return': Key.enter,
            'tab': Key.tab,
            'esc': Key.esc,
            'escape': Key.esc,
            'backspace': Key.backspace,
            'delete': Key.delete,
            'home': Key.home,
            'end': Key.end,
            'page_up': Key.page_up,
            'page_down': Key.page_down,
            'up': Key.up,
            'down': Key.down,
            'left': Key.left,
            'right': Key.right,
            
            # Function keys
            'f1': Key.f1, 'f2': Key.f2, 'f3': Key.f3, 'f4': Key.f4,
            'f5': Key.f5, 'f6': Key.f6, 'f7': Key.f7, 'f8': Key.f8,
            'f9': Key.f9, 'f10': Key.f10, 'f11': Key.f11, 'f12': Key.f12,
        }
    
    def parse_hotkey(self, hotkey_string: str) -> List[Union[Key, str]]:
        """
        Parse a hotkey string into a list of keys.
        
        Args:
            hotkey_string: String like 'shift + b' or 'ctrl + alt + delete'
            
        Returns:
            List of Key objects and character strings
        """
        # Split by '+' and strip whitespace
        key_parts = [part.strip().lower() for part in hotkey_string.split('+')]
        
        parsed_keys = []
        for key_part in key_parts:
            if key_part in self.key_mapping:
                parsed_keys.append(self.key_mapping[key_part])
            else:
                # Assume it's a regular character
                parsed_keys.append(key_part)
        
        return parsed_keys
    
    def run_hotkey(self, hotkey_string: str, hold_duration: float = 0.1):
        """
        Execute a hotkey combination.
        
        Args:
            hotkey_string: String representation of the hotkey (e.g., 'shift + b')
            hold_duration: How long to hold the keys in seconds
        """
        keys = self.parse_hotkey(hotkey_string)
        
        if not keys:
            print(f"Warning: No keys found in hotkey string '{hotkey_string}'")
            return
        
        try:
            # Press all keys
            for key in keys:
                self.keyboard.press(key)
            
            # Hold for the specified duration
            time.sleep(hold_duration)
            
            # Release all keys in reverse order
            for key in reversed(keys):
                self.keyboard.release(key)
                
        except Exception as e:
            print(f"Error executing hotkey '{hotkey_string}': {e}")
            # Make sure to release any pressed keys
            for key in reversed(keys):
                try:
                    self.keyboard.release(key)
                except:
                    pass


# Convenience function for direct use
def run_hotkey(hotkey_string: str, hold_duration: float = 0.1):
    """
    Convenience function to run a hotkey without creating a class instance.
    
    Args:
        hotkey_string: String representation of the hotkey (e.g., 'shift + b')
        hold_duration: How long to hold the keys in seconds
    """
    runner = HotkeyRunner()
    runner.run_hotkey(hotkey_string, hold_duration)


