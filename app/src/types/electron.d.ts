export interface ElectronAPI {
  startBluetoothScanning: () => Promise<{ success: boolean }>;
  stopBluetoothScanning: () => Promise<{ success: boolean }>;
  onDeviceUpdate: (callback: (data: DeviceUpdate) => void) => void;
  removeDeviceUpdateListener: (callback: (data: DeviceUpdate) => void) => void;
  saveDeviceConfig: (deviceId: string, config: DeviceConfig) => Promise<{ success: boolean }>;
  loadDeviceConfig: (deviceId: string) => Promise<DeviceConfig>;
  executeHotkey: (hotkeyString: string, holdDuration?: number) => Promise<{ success: boolean; error?: string }>;
  minimizeWindow: () => Promise<void>;
  toggleMaximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  rssi: number;
}

export interface DeviceUpdate {
  address: string;
  name: string;
  gpio_states: number[];
  timestamp: number;
  connected: boolean;
  event?: string;
  error?: string;
}

export interface GPIOAction {
  type: 'key' | 'multimedia' | 'system' | 'custom' | 'hotkey';
  action: string;
  params?: Record<string, any>;
  holdDuration?: number; // For hotkey actions
}

export interface DeviceConfig {
  id: string;
  name: string;
  gpios: Record<string, GPIOAction>;
  volumeGpio?: string;
}