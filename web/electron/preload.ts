import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Bluetooth device scanning
  startBluetoothScanning: () => ipcRenderer.invoke('start-bluetooth-scanning'),
  stopBluetoothScanning: () => ipcRenderer.invoke('stop-bluetooth-scanning'),
  
  // Device updates listener
  onDeviceUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('device-update', (_event, data) => callback(data));
  },
  
  // Remove device update listener
  removeDeviceUpdateListener: (callback: (data: any) => void) => {
    ipcRenderer.removeListener('device-update', callback);
  },
  
  // Device configuration
  saveDeviceConfig: (deviceId: string, config: any) => 
    ipcRenderer.invoke('save-device-config', deviceId, config),
  
  loadDeviceConfig: (deviceId: string) => 
    ipcRenderer.invoke('load-device-config', deviceId),
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;