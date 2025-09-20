import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceConfig, DeviceUpdate } from '../types/electron';

interface ConnectedDevice {
  address: string;
  name: string;
  gpioStates: number[];
  lastSeen: number;
  connected: boolean;
  added: boolean;
}

interface DeviceContextType {
  connectedDevices: Record<string, ConnectedDevice>;
  deviceConfigs: Record<string, DeviceConfig>;
  currentDevice: string | null;
  isScanning: boolean;
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  selectDevice: (address: string) => void;
  addDevice: (address: string) => void;
  updateDeviceConfig: (address: string, config: Partial<DeviceConfig>) => Promise<void>;
  loadDeviceConfig: (address: string) => Promise<DeviceConfig>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedDevices, setConnectedDevices] = useState<Record<string, ConnectedDevice>>({});
  const [deviceConfigs, setDeviceConfigs] = useState<Record<string, DeviceConfig>>({});
  const [currentDevice, setCurrentDevice] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Helper function to convert device address to config ID format
  const getDeviceConfigId = (address: string): string => {
    return address.replace(/:/g, '-').toLowerCase();
  };

  useEffect(() => {
    if (!window.electronAPI) return;

    const handleDeviceUpdate = (data: DeviceUpdate) => {
      if (data.error) {
        console.error('Device error:', data.error);
        return;
      }

      if (data.event === 'device_connected') {
        console.log('Device connected:', data.address);
        return;
      }

      if (data.event === 'device_disconnected') {
        setConnectedDevices(prev => {
          const updated = { ...prev };
          if (updated[data.address]) {
            updated[data.address].connected = false;
          }
          return updated;
        });
        return;
      }

      // Regular device update with GPIO data
      if (data.address && data.gpio_states) {
        setConnectedDevices(prev => ({
          ...prev,
          [data.address]: {
            address: data.address,
            name: data.name || `ESP32-${data.address.slice(-5)}`,
            gpioStates: data.gpio_states,
            lastSeen: Date.now(),
            connected: true,
            added: prev[data.address]?.added || false // Preserve added status or default to false
          }
        }));
      }
    };

    window.electronAPI.onDeviceUpdate(handleDeviceUpdate);

    return () => {
      window.electronAPI.removeDeviceUpdateListener(handleDeviceUpdate);
    };
  }, [currentDevice]);

  const startScanning = async () => {
    console.log('DeviceContext: startScanning called, isScanning:', isScanning);
    console.log('DeviceContext: window.electronAPI available:', !!window.electronAPI);
    
    if (!window.electronAPI || isScanning) {
      console.log('DeviceContext: Returning early - no electronAPI or already scanning');
      return;
    }
    
    console.log('DeviceContext: Setting isScanning to true');
    setIsScanning(true);
    try {
      console.log('DeviceContext: Calling electronAPI.startBluetoothScanning');
      await window.electronAPI.startBluetoothScanning();
      console.log('DeviceContext: Bluetooth scanning started successfully');
    } catch (error) {
      console.error('Error starting bluetooth scanning:', error);
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    console.log('DeviceContext: stopScanning called');
    if (!window.electronAPI) {
      console.log('DeviceContext: No electronAPI available');
      return;
    }
    
    try {
      console.log('DeviceContext: Calling electronAPI.stopBluetoothScanning');
      await window.electronAPI.stopBluetoothScanning();
      console.log('DeviceContext: Bluetooth scanning stopped successfully');
    } catch (error) {
      console.error('Error stopping bluetooth scanning:', error);
    } finally {
      console.log('DeviceContext: Setting isScanning to false');
      setIsScanning(false);
    }
  };

  const selectDevice = (address: string) => {
    setCurrentDevice(address);
    // Auto-load config when selecting device
    if (!deviceConfigs[address]) {
      loadDeviceConfig(address).catch(console.error);
    }
  };

  const addDevice = (address: string) => {
    setConnectedDevices(prev => ({
      ...prev,
      [address]: {
        ...prev[address],
        added: true
      }
    }));
  };

  // Auto-load config when currentDevice changes
  useEffect(() => {
    if (currentDevice && !deviceConfigs[currentDevice]) {
      loadDeviceConfig(currentDevice).catch(console.error);
    }
  }, [currentDevice]);

  const loadDeviceConfig = async (address: string): Promise<DeviceConfig> => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const configId = getDeviceConfigId(address);
    try {
      console.log('DeviceContext: Loading config from disk for device:', address, 'configId:', configId);
      const config = await window.electronAPI.loadDeviceConfig(configId);
      console.log('DeviceContext: Loaded config from disk for device:', address, config);
      setDeviceConfigs(prev => {
        const newConfigs = {
          ...prev,
          [address]: config
        };
        console.log('DeviceContext: Updated deviceConfigs state:', newConfigs);
        return newConfigs;
      });
      return config;
    } catch (error) {
      console.error('DeviceContext: Error loading device config:', error);
      throw error;
    }
  };

  const updateDeviceConfig = async (address: string, configUpdate: Partial<DeviceConfig>) => {
    if (!window.electronAPI) return;

    const configId = getDeviceConfigId(address);
    const currentConfig = deviceConfigs[address] || {
      id: configId,
      name: `ESP32-${address.slice(-5)}`,
      gpios: {},
      volumeGpio: 'd15'
    };

    const updatedConfig = { ...currentConfig, ...configUpdate };
    console.log('DeviceContext: Saving config for device:', address, 'configId:', configId, updatedConfig);

    try {
      await window.electronAPI.saveDeviceConfig(configId, updatedConfig);
      console.log('DeviceContext: Config saved to disk successfully');
      setDeviceConfigs(prev => {
        const newConfigs = {
          ...prev,
          [address]: updatedConfig
        };
        console.log('DeviceContext: Updated deviceConfigs state after save:', newConfigs);
        return newConfigs;
      });
    } catch (error) {
      console.error('DeviceContext: Error saving device config:', error);
    }
  };

  // Auto-start scanning on mount
  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <DeviceContext.Provider value={{
      connectedDevices,
      deviceConfigs,
      currentDevice,
      isScanning,
      startScanning,
      stopScanning,
      selectDevice,
      addDevice,
      updateDeviceConfig,
      loadDeviceConfig
    }}>
      {children}
    </DeviceContext.Provider>
  );
};