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
  
  // Hotkey execution
  executeHotkey: (hotkeyString, holdDuration) =>
    ipcRenderer.invoke('execute-hotkey', hotkeyString, holdDuration),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('toggle-maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
