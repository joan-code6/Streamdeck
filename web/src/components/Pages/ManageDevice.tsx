import React, { useState } from 'react';
import { useDevice } from '../../contexts/DeviceContext';
import { Settings, Volume2, Key, Monitor, Cpu, Save, RotateCw } from 'lucide-react';
import { GPIOAction, DeviceConfig } from '../../types/electron';

const actionTypes = [
  { value: 'key', label: 'Tastendruck', icon: Key },
  { value: 'multimedia', label: 'Multimedia', icon: Volume2 },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'custom', label: 'Benutzerdefiniert', icon: Cpu }
];

const predefinedActions = {
  key: [
    { action: 'space', label: 'Leertaste' },
    { action: 'enter', label: 'Enter' },
    { action: 'ctrl+c', label: 'Kopieren' },
    { action: 'ctrl+v', label: 'Einfügen' },
    { action: 'alt+tab', label: 'Alt+Tab' }
  ],
  multimedia: [
    { action: 'play_pause', label: 'Play/Pause' },
    { action: 'next_track', label: 'Nächster Titel' },
    { action: 'prev_track', label: 'Vorheriger Titel' },
    { action: 'volume_up', label: 'Lautstärke +' },
    { action: 'volume_down', label: 'Lautstärke -' },
    { action: 'mute', label: 'Stumm schalten' }
  ],
  system: [
    { action: 'screenshot', label: 'Screenshot' },
    { action: 'sleep', label: 'Ruhezustand' },
    { action: 'lock', label: 'Sperren' }
  ]
};

export const ManageDevice: React.FC = () => {
  const { currentDevice, connectedDevices, deviceConfigs, selectDevice, updateDeviceConfig, loadDeviceConfig } = useDevice();
  const [selectedGpio, setSelectedGpio] = useState<string | null>(null);
  const [configAction, setConfigAction] = useState<GPIOAction>({ type: 'key', action: '' });
  const [currentConfig, setCurrentConfig] = useState<DeviceConfig | null>(null);

  // Get the current device object
  const device = currentDevice ? connectedDevices[currentDevice] : null;
  const config = currentDevice ? deviceConfigs[currentDevice] : null;

  // Load device config when device changes
  React.useEffect(() => {
    if (currentDevice && !deviceConfigs[currentDevice]) {
      loadDeviceConfig(currentDevice).then(setCurrentConfig).catch(console.error);
    } else if (currentDevice) {
      setCurrentConfig(deviceConfigs[currentDevice]);
    }
  }, [currentDevice, deviceConfigs, loadDeviceConfig]);

  if (!currentDevice || !device) {
    const availableDevices = Object.values(connectedDevices);
    
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Kein Gerät ausgewählt</h2>
          <p className="text-gray-600 mb-6">Wähle ein Gerät aus oder füge ein neues hinzu</p>
          
          {availableDevices.length > 0 && (
            <div className="max-w-md mx-auto">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Verfügbare Geräte:</h3>
              <div className="space-y-2">
                {availableDevices.map((dev) => (
                  <button
                    key={dev.address}
                    onClick={() => selectDevice(dev.address)}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                  >
                    {dev.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const gpios = Array.from({ length: 16 }, (_, i) => `d${i}`);

  const handleGpioClick = (gpio: string) => {
    setSelectedGpio(gpio);
    const existingAction = config?.gpios[gpio];
    if (existingAction) {
      setConfigAction(existingAction);
    } else {
      setConfigAction({ type: 'key', action: '' });
    }
  };

  const handleSaveGpioConfig = async () => {
    if (selectedGpio && configAction.action && currentDevice) {
      const newGpios = {
        ...config?.gpios,
        [selectedGpio]: configAction
      };
      
      try {
        await updateDeviceConfig(currentDevice, { 
          gpios: newGpios,
          name: config?.name || device?.name || 'ESP32 Device'
        });
        setSelectedGpio(null);
        setConfigAction({ type: 'key', action: '' });
      } catch (error) {
        console.error('Failed to save GPIO config:', error);
      }
    }
  };

  const isVolumeGpio = (gpio: string) => gpio === 'd15';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerät verwalten</h1>
        <p className="text-gray-600">Konfiguriere die GPIO-Pins für "{device?.name || 'ESP32 Device'}"</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GPIO Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Cpu className="w-5 h-5 mr-2 text-blue-500" />
              GPIO Layout
            </h2>
            
            <div className="grid grid-cols-4 gap-3">
              {gpios.map((gpio) => {
                const isConfigured = !!config?.gpios[gpio];
                const isVolume = isVolumeGpio(gpio);
                const isSelected = selectedGpio === gpio;
                
                return (
                  <button
                    key={gpio}
                    onClick={() => handleGpioClick(gpio)}
                    className={`aspect-square p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : isVolume
                        ? 'border-orange-300 bg-orange-50 hover:border-orange-400'
                        : isConfigured 
                        ? 'border-green-300 bg-green-50 hover:border-green-400'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    } hover:shadow-md`}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      {isVolume ? (
                        <RotateCw className="w-6 h-6 text-orange-500 mb-2" />
                      ) : isConfigured ? (
                        <Key className="w-6 h-6 text-green-500 mb-2" />
                      ) : (
                        <div className="w-6 h-6 border-2 border-gray-300 border-dashed rounded mb-2" />
                      )}
                      <span className="text-xs font-medium text-gray-700">{gpio.toUpperCase()}</span>
                      {isVolume && (
                        <span className="text-xs text-orange-600 mt-1">Volume</span>
                      )}
                      {isConfigured && !isVolume && (
                        <span className="text-xs text-green-600 mt-1">{config?.gpios[gpio]?.action}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>Konfiguriert</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                  <span>Lautstärkeregler</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                  <span>Nicht konfiguriert</span>
                </div>
              </div>
              
              <button
                onClick={handleSaveGpioConfig}
                disabled={!selectedGpio || !configAction.action}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Save className="w-4 h-4" />
                <span>Speichern</span>
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Konfiguration</h2>
          
          {selectedGpio ? (
            <div>
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  {isVolumeGpio(selectedGpio) ? (
                    <>
                      <RotateCw className="w-4 h-4 mr-2 text-orange-500" />
                      {selectedGpio.toUpperCase()} - Lautstärkeregler
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2 text-blue-500" />
                      {selectedGpio.toUpperCase()}
                    </>
                  )}
                </h3>
                
                {isVolumeGpio(selectedGpio) ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Volume2 className="w-5 h-5 text-orange-500" />
                      <span className="font-medium text-orange-800">Lautstärkeregler</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      GPIO D15 ist als Drehregler für die Systemlautstärke konfiguriert.
                      Diese Einstellung kann nicht geändert werden.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Action Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Aktionstyp</label>
                      <select
                        value={configAction.type}
                        onChange={(e) => setConfigAction({ ...configAction, type: e.target.value as any, action: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {actionTypes.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Action Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Aktion</label>
                      {configAction.type !== 'custom' ? (
                        <select
                          value={configAction.action}
                          onChange={(e) => setConfigAction({ ...configAction, action: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Aktion wählen...</option>
                          {predefinedActions[configAction.type as keyof typeof predefinedActions]?.map((action) => (
                            <option key={action.action} value={action.action}>{action.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={configAction.action}
                          onChange={(e) => setConfigAction({ ...configAction, action: e.target.value })}
                          placeholder="Benutzerdefinierte Aktion eingeben..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                    </div>

                    <button
                      onClick={handleSaveGpioConfig}
                      disabled={!configAction.action}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      GPIO konfigurieren
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600">Wähle einen GPIO-Pin zum Konfigurieren</p>
            </div>
          )}
        </div>
      </div>

      {/* Device Selector */}
      {Object.keys(connectedDevices).length > 1 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gerät wechseln</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(connectedDevices).map((dev) => (
              <button
                key={dev.address}
                onClick={() => selectDevice(dev.address)}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  dev.address === currentDevice 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="font-medium text-gray-900">{dev.name}</div>
                <div className="text-sm text-gray-500">{dev.address}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {Object.keys(deviceConfigs[dev.address]?.gpios || {}).length} GPIOs konfiguriert
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};