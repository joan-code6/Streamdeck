const { contextBridge, ipcRenderer } = require('electron');

const api = {
  // Bluetooth device scanning
  startBluetoothScanning: () => ipcRenderer.invoke('start-bluetooth-scanning'),
  stopBluetoothScanning: () => ipcRenderer.invoke('stop-bluetooth-scanning'),
  
  // Device updates listener
  onDeviceUpdate: (callback) => {
    ipcRenderer.on('device-update', (_event, data) => callback(data));
  },
  
  // Remove device update listener
  removeDeviceUpdateListener: (callback) => {
    ipcRenderer.removeListener('device-update', callback);
  },
  
  // Device configuration
  saveDeviceConfig: (deviceId, config) => 
    ipcRenderer.invoke('save-device-config', deviceId, config),
  
  loadDeviceConfig: (deviceId) => 
    ipcRenderer.invoke('load-device-config', deviceId),
};

contextBridge.exposeInMainWorld('electronAPI', api);
