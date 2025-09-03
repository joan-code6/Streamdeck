import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceConfig, DeviceUpdate } from '../types/electron';

interface ConnectedDevice {
  address: string;
  name: string;
  gpioStates: number[];
  lastSeen: number;
  connected: boolean;
}

interface DeviceContextType {
  connectedDevices: Record<string, ConnectedDevice>;
  deviceConfigs: Record<string, DeviceConfig>;
  currentDevice: string | null;
  isScanning: boolean;
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  selectDevice: (address: string) => void;
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
            connected: true
          }
        }));

        // Auto-select first device if none selected
        if (!currentDevice) {
          setCurrentDevice(data.address);
        }
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
  };

  const loadDeviceConfig = async (address: string): Promise<DeviceConfig> => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    try {
      const config = await window.electronAPI.loadDeviceConfig(address);
      setDeviceConfigs(prev => ({
        ...prev,
        [address]: config
      }));
      return config;
    } catch (error) {
      console.error('Error loading device config:', error);
      throw error;
    }
  };

  const updateDeviceConfig = async (address: string, configUpdate: Partial<DeviceConfig>) => {
    if (!window.electronAPI) return;

    const currentConfig = deviceConfigs[address] || {
      id: address,
      name: `ESP32-${address.slice(-5)}`,
      gpios: {},
      volumeGpio: 'd15'
    };

    const updatedConfig = { ...currentConfig, ...configUpdate };

    try {
      await window.electronAPI.saveDeviceConfig(address, updatedConfig);
      setDeviceConfigs(prev => ({
        ...prev,
        [address]: updatedConfig
      }));
    } catch (error) {
      console.error('Error saving device config:', error);
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
      updateDeviceConfig,
      loadDeviceConfig
    }}>
      {children}
    </DeviceContext.Provider>
  );
};