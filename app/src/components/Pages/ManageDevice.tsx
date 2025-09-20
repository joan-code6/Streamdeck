import React, { useState } from 'react';
import { useDevice } from '../../contexts/DeviceContext';
import { Settings, Volume2, Key, Monitor, Cpu, Save, RotateCw, Keyboard } from 'lucide-react';
import { GPIOAction } from '../../types/electron';

const actionTypes = [
  { value: 'key', label: 'Tastendruck', icon: Key },
  { value: 'hotkey', label: 'Hotkey-Kombination', icon: Keyboard },
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
  hotkey: [
    { action: 'ctrl + c', label: 'Kopieren (Ctrl+C)' },
    { action: 'ctrl + v', label: 'Einfügen (Ctrl+V)' },
    { action: 'ctrl + z', label: 'Rückgängig (Ctrl+Z)' },
    { action: 'ctrl + y', label: 'Wiederholen (Ctrl+Y)' },
    { action: 'ctrl + s', label: 'Speichern (Ctrl+S)' },
    { action: 'ctrl + a', label: 'Alles auswählen (Ctrl+A)' },
    { action: 'alt + tab', label: 'App wechseln (Alt+Tab)' },
    { action: 'alt + f4', label: 'Schließen (Alt+F4)' },
    { action: 'win + d', label: 'Desktop anzeigen (Win+D)' },
    { action: 'win + l', label: 'Sperren (Win+L)' },
    { action: 'ctrl + shift + esc', label: 'Task-Manager (Ctrl+Shift+Esc)' },
    { action: 'f11', label: 'Vollbild (F11)' },
    { action: 'ctrl + shift + n', label: 'Neues privates Fenster' },
    { action: 'ctrl + shift + t', label: 'Letzten Tab wiederherstellen' }
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
  const [testingHotkey, setTestingHotkey] = useState(false);

  // Get the current device object
  const device = currentDevice ? connectedDevices[currentDevice] : null;
  const config = currentDevice ? deviceConfigs[currentDevice] : null;

  // Test hotkey function
  const testHotkey = async () => {
    console.log('Testing hotkey, configAction:', configAction);
    console.log('window.electronAPI available:', !!window.electronAPI);
    console.log('window.electronAPI.executeHotkey available:', !!(window.electronAPI && window.electronAPI.executeHotkey));
    
    if (configAction.type === 'hotkey' && configAction.action) {
      // Check if electronAPI is available
      if (!window.electronAPI || typeof window.electronAPI.executeHotkey !== 'function') {
        console.error('Electron API check failed:', {
          electronAPI: window.electronAPI,
          executeHotkey: window.electronAPI?.executeHotkey,
          type: typeof window.electronAPI?.executeHotkey
        });
        alert('Electron API nicht verfügbar. Bitte starten Sie die Anwendung neu.');
        return;
      }
      
      setTestingHotkey(true);
      try {
        // Extract the actual hotkey string (remove 'predefined:' prefix if present)
        const hotkeyString = configAction.action.startsWith('predefined:') 
          ? configAction.action.replace('predefined:', '') 
          : configAction.action;
        
        console.log('Executing hotkey:', hotkeyString, 'with duration:', configAction.holdDuration);
        const holdDuration = configAction.holdDuration || 0.1;
        await window.electronAPI.executeHotkey(hotkeyString, holdDuration);
        console.log('Hotkey tested successfully:', hotkeyString);
        alert('Hotkey erfolgreich getestet!');
      } catch (error) {
        console.error('Failed to test hotkey:', error);
        alert('Fehler beim Testen des Hotkeys: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setTestingHotkey(false);
      }
    } else {
      console.log('Hotkey test skipped - invalid config:', { type: configAction.type, action: configAction.action });
    }
  };

  // Load device config when component mounts or device changes
  React.useEffect(() => {
    if (currentDevice) {
      console.log('ManageDevice: Loading config for device:', currentDevice);
      // Always reload the latest config from disk when entering this page
      loadDeviceConfig(currentDevice).then((config) => {
        console.log('ManageDevice: Config loaded successfully:', config);
      }).catch((error) => {
        console.error('ManageDevice: Error loading config:', error);
      });
    }
  }, [currentDevice, loadDeviceConfig]);

  // Also load config on component mount to ensure we have the latest
  React.useEffect(() => {
    if (currentDevice && window.electronAPI) {
      console.log('ManageDevice: Component mounted, loading config for:', currentDevice);
      loadDeviceConfig(currentDevice).then((config) => {
        console.log('ManageDevice: Mount config loaded successfully:', config);
      }).catch((error) => {
        console.error('ManageDevice: Mount error loading config:', error);
      });
    }
  }, []); // Empty dependency array - runs only on mount

  // Check electronAPI availability
  React.useEffect(() => {
    const checkElectronAPI = () => {
      console.log('Electron API check on mount:', {
        electronAPI: !!window.electronAPI,
        executeHotkey: !!(window.electronAPI?.executeHotkey),
        type: typeof window.electronAPI?.executeHotkey
      });
    };
    
    // Check immediately
    checkElectronAPI();
    
    // Check after a short delay in case it's loaded asynchronously
    const timeout = setTimeout(checkElectronAPI, 1000);
    
    return () => clearTimeout(timeout);
  }, []);

  if (!currentDevice || !device) {
    const availableDevices = Object.values(connectedDevices).filter(device => device.added);
    
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

  // Only show the GPIO pins that the ESP32 actually supports
  const supportedGpios = ['d2', 'd4', 'd5', 'd12', 'd13', 'd14', 'd15', 'd16', 'd17', 'd18', 'd19', 'd21', 'd25', 'd26', 'd27', 'd33'];
  
  // GPIO pin descriptions for better user understanding
  const gpioLabels: { [key: string]: string } = {
    'd2': 'Button 1',
    'd4': 'Button 2', 
    'd5': 'Button 3',
    'd12': 'Button 4',
    'd13': 'Button 5',
    'd14': 'Button 6',
    'd15': 'Volume/Rotary',
    'd16': 'Button 7',
    'd17': 'Button 8',
    'd18': 'Button 9',
    'd19': 'Button 10',
    'd21': 'Button 11',
    'd25': 'Button 12',
    'd26': 'Button 13',
    'd27': 'Button 14',
    'd33': 'Button 15'
  };

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
      // Clean the action string (remove 'predefined:' prefix if present)
      const cleanAction = configAction.action.startsWith('predefined:') 
        ? configAction.action.replace('predefined:', '') 
        : configAction.action;
      
      const cleanConfigAction = {
        ...configAction,
        action: cleanAction
      };
      
      const newGpios = {
        ...config?.gpios,
        [selectedGpio]: cleanConfigAction
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
              {supportedGpios.map((gpio: string) => {
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
                        (() => {
                          const actionType = config?.gpios[gpio]?.type;
                          switch (actionType) {
                            case 'hotkey':
                              return <Keyboard className="w-6 h-6 text-purple-500 mb-2" />;
                            case 'multimedia':
                              return <Volume2 className="w-6 h-6 text-blue-500 mb-2" />;
                            case 'system':
                              return <Monitor className="w-6 h-6 text-gray-500 mb-2" />;
                            case 'custom':
                              return <Cpu className="w-6 h-6 text-indigo-500 mb-2" />;
                            default:
                              return <Key className="w-6 h-6 text-green-500 mb-2" />;
                          }
                        })()
                      ) : (
                        <div className="w-6 h-6 border-2 border-gray-300 border-dashed rounded mb-2" />
                      )}
                      <span className="text-xs font-medium text-gray-700">{gpio.toUpperCase()}</span>
                      <span className="text-xs text-gray-500 mt-1">{gpioLabels[gpio]}</span>
                      {isVolume && (
                        <span className="text-xs text-orange-600 mt-1">Volume</span>
                      )}
                      {isConfigured && !isVolume && (
                        <span className="text-xs text-green-600 mt-1" title={config?.gpios[gpio]?.action}>
                          {config?.gpios[gpio]?.action && config.gpios[gpio].action.length > 8 
                            ? config.gpios[gpio].action.substring(0, 8) + '...' 
                            : config?.gpios[gpio]?.action}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Key className="w-3 h-3 text-green-500" />
                  <span>Tastendruck</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Keyboard className="w-3 h-3 text-purple-500" />
                  <span>Hotkey</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Volume2 className="w-3 h-3 text-blue-500" />
                  <span>Multimedia</span>
                </div>
                <div className="flex items-center space-x-1">
                  <RotateCw className="w-3 h-3 text-orange-500" />
                  <span>Lautstärkeregler</span>
                </div>
                <div className="flex items-center space-x-1">
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
                      {(() => {
                        switch (configAction.type) {
                          case 'hotkey':
                            return <Keyboard className="w-4 h-4 mr-2 text-purple-500" />;
                          case 'multimedia':
                            return <Volume2 className="w-4 h-4 mr-2 text-blue-500" />;
                          case 'system':
                            return <Monitor className="w-4 h-4 mr-2 text-gray-500" />;
                          case 'custom':
                            return <Cpu className="w-4 h-4 mr-2 text-indigo-500" />;
                          default:
                            return <Key className="w-4 h-4 mr-2 text-green-500" />;
                        }
                      })()}
                      {selectedGpio.toUpperCase()} - {actionTypes.find(t => t.value === configAction.type)?.label}
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
                      {configAction.type !== 'custom' && configAction.type !== 'hotkey' ? (
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
                      ) : configAction.type === 'hotkey' ? (
                        <div className="space-y-3">
                          <select
                            value={configAction.action.startsWith('predefined:') ? configAction.action.replace('predefined:', '') : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                setConfigAction({ ...configAction, action: `predefined:${e.target.value}` });
                              } else {
                                setConfigAction({ ...configAction, action: '' });
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Hotkey wählen...</option>
                            {predefinedActions.hotkey.map((action) => (
                              <option key={action.action} value={action.action}>{action.label}</option>
                            ))}
                          </select>
                          <div className="text-xs text-gray-600">
                            <p className="mb-1">Oder eigene Hotkey-Kombination eingeben:</p>
                          </div>
                          <input
                            type="text"
                            value={configAction.action.startsWith('predefined:') ? '' : configAction.action}
                            onChange={(e) => setConfigAction({ ...configAction, action: e.target.value })}
                            placeholder="z.B. ctrl + shift + b"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Haltezeit (Sekunden)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="2.0"
                                value={configAction.holdDuration || 0.1}
                                onChange={(e) => setConfigAction({ ...configAction, holdDuration: parseFloat(e.target.value) })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={testHotkey}
                                disabled={!configAction.action || testingHotkey}
                                className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-2 py-1 rounded text-sm transition-colors duration-200"
                              >
                                {testingHotkey ? 'Teste...' : 'Testen'}
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            <p className="font-medium mb-1">Unterstützte Tasten:</p>
                            <p><strong>Modifikatoren:</strong> ctrl, shift, alt, win</p>
                            <p><strong>Spezial:</strong> space, enter, tab, esc, f1-f12, arrows</p>
                            <p><strong>Beispiele:</strong> "ctrl + c", "alt + tab", "win + d"</p>
                          </div>
                        </div>
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
      {Object.values(connectedDevices).filter(dev => dev.added).length > 1 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gerät wechseln</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(connectedDevices).filter(dev => dev.added).map((dev) => (
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