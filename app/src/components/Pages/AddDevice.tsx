import React, { useState } from 'react';
import { useDevice } from '../../contexts/DeviceContext';
import { Bluetooth, Search, Plus, Wifi, AlertCircle } from 'lucide-react';

export const AddDevice: React.FC = () => {
  const { connectedDevices, isScanning, startScanning, stopScanning, updateDeviceConfig, addDevice } = useDevice();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const connectedDeviceList = Object.values(connectedDevices);

  const handleScan = async () => {
    console.log('Scan button clicked, isScanning:', isScanning);
    try {
      if (isScanning) {
        console.log('Stopping scan...');
        await stopScanning();
        console.log('Scan stopped');
      } else {
        console.log('Starting scan...');
        await startScanning();
        console.log('Scan started');
      }
    } catch (error) {
      console.error('Scan operation failed:', error);
    }
  };

  const handleSelectDevice = (address: string) => {
    const device = connectedDevices[address];
    if (device) {
      setSelectedDevice(address);
      setDeviceName(device.name || 'Mein Stream Deck');
      setShowNameInput(true);
    }
  };

  const handleAddDevice = async () => {
    if (selectedDevice && deviceName.trim()) {
      await updateDeviceConfig(selectedDevice, { 
        name: deviceName.trim(),
        id: selectedDevice 
      });
      addDevice(selectedDevice);
      setSelectedDevice(null);
      setDeviceName('');
      setShowNameInput(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerät hinzufügen</h1>
        <p className="text-gray-600">Suche nach verfügbaren DIY Stream Deck Geräten über Bluetooth</p>
      </div>

      {/* Scan Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bluetooth className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bluetooth-Scan</h2>
              <p className="text-sm text-gray-600">Nach Stream Deck Geräten suchen</p>
            </div>
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            {isScanning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Suche...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Scannen</span>
              </>
            )}
          </button>
        </div>

        {/* Device List */}
        {connectedDeviceList.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 mb-3">Gefundene Geräte:</h3>
            {connectedDeviceList.map((device: any) => (
              <div
                key={device.address}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                onClick={() => handleSelectDevice(device.address)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    device.connected ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Wifi className={`w-4 h-4 ${device.connected ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{device.name || 'Unbekanntes Gerät'}</h4>
                    <p className="text-sm text-gray-500">{device.address}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Status</span>
                    <div className={`text-sm font-medium ${
                      device.connected ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {device.connected ? 'Verbunden' : 'Getrennt'}
                    </div>
                  </div>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200">
                    Auswählen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {connectedDeviceList.length === 0 && !isScanning && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">Klicke "Scannen" um nach Geräten zu suchen</p>
          </div>
        )}
      </div>

      {/* Device Name Input */}
      {showNameInput && selectedDevice && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-green-500" />
            Gerät konfigurieren
          </h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-blue-800">
                Ausgewähltes Gerät: {connectedDevices[selectedDevice]?.name}
              </span>
            </div>
            <p className="text-sm text-blue-600 mt-1">{selectedDevice}</p>
          </div>

          <div className="mb-6">
            <label htmlFor="deviceName" className="block text-sm font-medium text-gray-700 mb-2">
              Gerätename
            </label>
            <input
              type="text"
              id="deviceName"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="z.B. Mein Stream Deck"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowNameInput(false);
                setSelectedDevice(null);
                setDeviceName('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAddDevice}
              disabled={!deviceName.trim()}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Gerät hinzufügen</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};