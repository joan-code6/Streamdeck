export interface ElectronAPI {
  startBluetoothScanning: () => Promise<{ success: boolean }>;
  stopBluetoothScanning: () => Promise<{ success: boolean }>;
  onDeviceUpdate: (callback: (data: DeviceUpdate) => void) => void;
  removeDeviceUpdateListener: (callback: (data: DeviceUpdate) => void) => void;
  saveDeviceConfig: (deviceId: string, config: DeviceConfig) => Promise<{ success: boolean }>;
  loadDeviceConfig: (deviceId: string) => Promise<DeviceConfig>;
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
  type: 'key' | 'multimedia' | 'system' | 'custom';
  action: string;
  params?: Record<string, any>;
}

export interface DeviceConfig {
  id: string;
  name: string;
  gpios: Record<string, GPIOAction>;
  volumeGpio?: string;
}