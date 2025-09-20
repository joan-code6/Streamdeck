import React, { useEffect, useState } from 'react';
import { useDevice } from '../../contexts/DeviceContext';
import { Cpu, Bluetooth, Activity, Circle } from 'lucide-react';

export const Home: React.FC = () => {
  const { connectedDevices, currentDevice, isScanning, loadDeviceConfig, selectDevice } = useDevice();
  const [currentConfig, setCurrentConfig] = useState<any>(null);

  const connectedDeviceList = Object.values(connectedDevices).filter(device => device.added);
  const currentDeviceData = currentDevice ? connectedDevices[currentDevice] : null;

  useEffect(() => {
    if (currentDevice) {
      loadDeviceConfig(currentDevice).then(setCurrentConfig).catch(console.error);
    }
  }, [currentDevice, loadDeviceConfig]);

  const stats = [
    {
      label: 'Verbundene Geräte',
      value: connectedDeviceList.filter((d: any) => d.connected).length,
      icon: Bluetooth,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Konfigurierte GPIOs',
      value: currentConfig ? Object.keys(currentConfig.gpios || {}).length : 0,
      icon: Cpu,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Aktuelle Session',
      value: currentDeviceData?.connected ? 'Aktiv' : 'Inaktiv',
      icon: Activity,
      color: currentDeviceData?.connected ? 'text-green-500' : 'text-gray-500',
      bgColor: currentDeviceData?.connected ? 'bg-green-50' : 'bg-gray-50'
    }
  ];

  // Define GPIO pin labels
  const gpioPins = [15, 2, 4, 16, 17, 5, 18, 19, 21, 13, 12, 14, 27, 26, 25, 33];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Willkommen bei deinem DIY Stream Deck Control Center</p>
        {isScanning && (
          <div className="mt-2 flex items-center text-blue-600">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
            Scanne nach Bluetooth-Geräten...
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center mr-4`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Device Display */}
      {currentDeviceData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{currentDeviceData.name}</h2>
              <p className="text-gray-600">{currentDevice}</p>
            </div>
            <div className="flex items-center">
              <Circle className={`w-3 h-3 mr-2 ${currentDeviceData.connected ? 'text-green-500 fill-current' : 'text-red-500'}`} />
              <span className={currentDeviceData.connected ? 'text-green-500' : 'text-red-500'}>
                {currentDeviceData.connected ? 'Verbunden' : 'Getrennt'}
              </span>
            </div>
          </div>

          {/* GPIO Grid */}
          <div className="grid grid-cols-4 gap-4">
            {gpioPins.map((pin, index) => {
              const value = currentDeviceData.gpioStates[index] || 0;
              const isRotary = pin === 15;
              const percentage = isRotary ? Math.round((value / 4095) * 100) : 0;
              
              return (
                <div
                  key={pin}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    isRotary
                      ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'
                      : value > 0
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-700 mb-1">D{pin}</div>
                  {isRotary ? (
                    <div>
                      <div className="text-lg font-bold text-purple-600">{percentage}%</div>
                      <div className="text-xs text-gray-500">{value}</div>
                    </div>
                  ) : (
                    <div className={`text-lg font-bold ${value > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {value > 0 ? 'HIGH' : 'LOW'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Device List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Erkannte Geräte</h2>
        {connectedDeviceList.length === 0 ? (
          <div className="text-center py-8">
            <Bluetooth className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Keine Geräte gefunden</p>
            <p className="text-sm text-gray-400">Stelle sicher, dass dein ESP32 eingeschaltet ist</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connectedDeviceList.map((device: any) => (
              <div
                key={device.address}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  currentDevice === device.address
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => selectDevice(device.address)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{device.name}</h3>
                    <p className="text-sm text-gray-600">{device.address}</p>
                  </div>
                  <div className="flex items-center">
                    <Circle className={`w-3 h-3 mr-2 ${device.connected ? 'text-green-500 fill-current' : 'text-red-500'}`} />
                    <span className={`text-sm ${device.connected ? 'text-green-500' : 'text-red-500'}`}>
                      {device.connected ? 'Verbunden' : 'Getrennt'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
