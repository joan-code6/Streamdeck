const { spawn } = require('child_process');
const path = require('path');

// GPIO pin mapping for display
const gpioPins = [15, 2, 4, 16, 17, 5, 18, 19, 21, 13, 12, 14, 27, 26, 25, 33];

// DOM elements
const scanBtn = document.getElementById('scanBtn');
const connectionStatus = document.getElementById('connectionStatus');
const connectionText = document.getElementById('connectionText');
const deviceCount = document.getElementById('deviceCount');
const devicesGrid = document.getElementById('devicesGrid');
const logsContainer = document.getElementById('logsContainer');

// Application state
let devices = {};
let connectedDevices = {};
let pythonProcess = null;
let isScanning = false;

// Python script path
const pythonScript = path.join(__dirname, 'main.py');

// Initialize Python process
function startPythonProcess() {
    logMessage('Starting Python BLE process...', 'system');

    pythonProcess = spawn('python', [pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: __dirname
    });

    pythonProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
            handlePythonOutput(output);
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error) {
            logMessage(`Python error: ${error}`, 'error');
        }
    });

    pythonProcess.on('close', (code) => {
        logMessage(`Python process exited with code ${code}`, 'system');
        updateConnectionStatus('error');
    });

    pythonProcess.on('error', (error) => {
        logMessage(`Failed to start Python process: ${error.message}`, 'error');
        updateConnectionStatus('error');
    });
}

function handlePythonOutput(output) {
    // Parse Python script output
    if (output.includes('Found device:')) {
        const match = output.match(/Found device: (.+) at (.+)/);
        if (match) {
            const deviceName = match[1];
            const deviceAddress = match[2];
            addDevice(deviceName, deviceAddress);
        }
    } else if (output.includes('Connected to')) {
        const match = output.match(/Connected to (.+)/);
        if (match) {
            const deviceAddress = match[1];
            // Find device by address and update status
            for (const [deviceName, device] of Object.entries(devices)) {
                if (device.address === deviceAddress) {
                    updateDeviceStatus(deviceName, true);
                    break;
                }
            }
        }
    } else if (output.includes('GPIO update') || output.includes('GPIO States')) {
        const match = output.match(/\[([^\]]+)\] GPIO States: (.+)/);
        if (match) {
            const deviceId = match[1];
            const gpioStr = match[2];
            const gpios = gpioStr.replace(/[\[\]]/g, '').split(',').map(x => parseInt(x.trim()) || 0);
            updateDeviceGPIO(deviceId, gpios);
            
            // Also update device status to connected when receiving data
            if (devices[deviceId]) {
                devices[deviceId].connected = true;
                devices[deviceId].lastSeen = new Date();
                updateDeviceStatus(deviceId, true);
            }
        }
    } else if (output.includes('verified connection')) {
        const match = output.match(/✓ Device (.+) verified/);
        if (match) {
            const deviceId = match[1];
            logMessage(`Device ${deviceId} verified connection`, 'device');
            // Ensure device is marked as connected
            if (devices[deviceId]) {
                devices[deviceId].connected = true;
                updateDeviceStatus(deviceId, true);
            }
        }
    } else if (output.includes('Keep-alive from')) {
        const match = output.match(/♥ Keep-alive from (.+)/);
        if (match) {
            const deviceId = match[1];
            // Update last seen time for keep-alive
            if (devices[deviceId]) {
                devices[deviceId].lastSeen = new Date();
                devices[deviceId].connected = true;
            }
        }
        // Don't log keep-alive messages to avoid spam
        return;
    } else if (output.includes('Scanning for devices')) {
        updateConnectionStatus('scanning');
        logMessage('Scanning for ESP32 devices...', 'system');
    } else if (output.includes('No devices found')) {
        updateConnectionStatus('ready');
        logMessage('No devices found, will continue scanning', 'system');
    } else if (output.includes('New device registered')) {
        const match = output.match(/New device registered: (.+)/);
        if (match) {
            const deviceId = match[1];
            logMessage(`New device registered: ${deviceId}`, 'device');
            // Create device entry if it doesn't exist
            if (!devices[deviceId]) {
                addDevice(deviceId, 'unknown');
            }
        }
    } else if (output.includes('Connection to') && output.includes('lost')) {
        const match = output.match(/Connection to (.+) lost/);
        if (match) {
            const deviceAddress = match[1];
            // Find device by address and update status
            for (const [deviceName, device] of Object.entries(devices)) {
                if (device.address === deviceAddress) {
                    updateDeviceStatus(deviceName, false);
                    break;
                }
            }
            logMessage(`Connection lost, retrying...`, 'error');
        }
    } else if (output.includes('ESP32 BLE Monitor running continuously')) {
        updateConnectionStatus('ready');
        logMessage('BLE Monitor is running continuously', 'system');
    } else if (output.includes('Listening for GPIO data')) {
        logMessage('Connected and listening for GPIO data', 'device');
    } else {
        // Log other important messages
        if (output.trim() && !output.includes('♥') && !output.includes('retry') && !output.includes('Will retry connection')) {
            logMessage(output, 'info');
        }
    }
}

function addDevice(deviceName, deviceAddress) {
    if (!devices[deviceName]) {
        devices[deviceName] = {
            address: deviceAddress,
            name: deviceName,
            gpios: Array(16).fill(0),  // Updated to 16 GPIOs
            connected: false,
            lastSeen: new Date()
        };
        addDeviceCard(deviceName);
        logMessage(`Discovered device: ${deviceName}`, 'device');
    }
    updateDeviceCount();
}

// Update device status tracking
function updateDeviceTracking() {
    const currentTime = new Date();
    
    for (const [deviceId, device] of Object.entries(devices)) {
        const secondsSinceLastSeen = Math.floor((currentTime - device.lastSeen) / 1000);
        
        if (secondsSinceLastSeen > 15) { // 15 seconds timeout
            if (device.connected) {
                device.connected = false;
                updateDeviceStatus(deviceId, false);
                logMessage(`Device ${deviceId} appears disconnected (no data for ${secondsSinceLastSeen}s)`, 'error');
            }
        }
    }
}

// Run device tracking every 5 seconds
setInterval(updateDeviceTracking, 5000);

// UI Functions
function updateConnectionStatus(status) {
    connectionStatus.className = 'status-dot';

    switch (status) {
        case 'ready':
            connectionStatus.classList.add('connected');
            connectionText.textContent = 'Ready';
            break;
        case 'scanning':
            connectionStatus.classList.add('scanning');
            connectionText.textContent = 'Scanning...';
            break;
        case 'connected':
            connectionStatus.classList.add('connected');
            connectionText.textContent = 'Connected';
            break;
        case 'error':
            connectionText.textContent = 'Error';
            break;
        default:
            connectionText.textContent = 'Disconnected';
    }
}

function updateDeviceCount() {
    const count = Object.keys(devices).length;
    deviceCount.textContent = `${count} device${count !== 1 ? 's' : ''} found`;
}

function addDeviceCard(deviceId) {
    const device = devices[deviceId];
    const card = document.createElement('div');
    card.className = 'device-card';
    card.id = `device-${deviceId}`;

    card.innerHTML = `
        <div class="device-header">
            <div class="device-name">${deviceId}</div>
            <div class="device-status status-disconnected">Disconnected</div>
        </div>
        <button class="connect-btn" onclick="connectDevice('${deviceId}')">
            Connect
        </button>
        <div class="gpio-grid" id="gpio-${deviceId}">
            ${Array.from({length: 16}, (_, i) => {
                const pinNum = gpioPins[i] || i;
                const isRotary = pinNum === 15;
                const label = isRotary ? 'D15 (Rotary)' : `D${pinNum}`;
                return `
                    <div class="gpio-pin ${isRotary ? 'analog' : 'low'}" id="gpio-${deviceId}-${i}">
                        ${pinNum}
                        <div class="gpio-label">${label}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    devicesGrid.appendChild(card);
}

function updateDeviceGPIO(deviceId, gpios) {
    if (!gpios || !Array.isArray(gpios)) return;

    gpios.forEach((value, index) => {
        const pinElement = document.getElementById(`gpio-${deviceId}-${index}`);
        if (pinElement) {
            pinElement.className = 'gpio-pin';

            // Special handling for D15 (rotary encoder)
            if (gpioPins[index] === 15) {
                pinElement.classList.add('analog');
                // Map analog value (0-4095) to percentage (0-100)
                const percentage = Math.round((value / 4095) * 100);
                pinElement.innerHTML = `${value}<div class="gpio-label">D15 (${percentage}%)</div>`;
                pinElement.style.background = `linear-gradient(45deg, 
                    hsl(${percentage * 1.2}, 70%, 50%) 0%, 
                    hsl(${percentage * 1.2 + 30}, 70%, 60%) 100%)`;
            } else if (typeof value === 'number' && value > 1) {
                // Other analog values
                pinElement.classList.add('analog');
                pinElement.innerHTML = `${value}<div class="gpio-label">D${gpioPins[index]}</div>`;
            } else if (value === 1 || value === true) {
                // Digital high
                pinElement.classList.add('high');
                pinElement.innerHTML = `${gpioPins[index]}<div class="gpio-label">D${gpioPins[index]}</div>`;
            } else {
                // Digital low
                pinElement.classList.add('low');
                pinElement.innerHTML = `${gpioPins[index]}<div class="gpio-label">D${gpioPins[index]}</div>`;
            }
        }
    });
}

function updateDeviceStatus(deviceId, connected) {
    const statusElement = document.querySelector(`#device-${deviceId} .device-status`);
    const connectBtn = document.querySelector(`#device-${deviceId} .connect-btn`);

    if (statusElement) {
        statusElement.className = `device-status ${connected ? 'status-connected' : 'status-disconnected'}`;
        statusElement.textContent = connected ? 'Connected' : 'Disconnected';
    }

    if (connectBtn) {
        connectBtn.textContent = connected ? 'Disconnect' : 'Connect';
        connectBtn.onclick = () => connected ? disconnectDevice(deviceId) : connectDevice(deviceId);
    }
}

function logMessage(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';

    const timestamp = new Date().toLocaleTimeString();
    const typeClass = `log-${type}`;

    logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> <span class="${typeClass}">${message}</span>`;

    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

// Control Functions
async function startScan() {
    if (isScanning) return;

    try {
        isScanning = true;
        updateConnectionStatus('scanning');
        scanBtn.textContent = 'Scanning...';
        scanBtn.disabled = true;

        // The Python process will handle scanning
        // We'll wait for it to find devices

        setTimeout(() => {
            stopScan();
        }, 10000); // Scan for 10 seconds

    } catch (error) {
        logMessage(`Scan error: ${error.message}`, 'error');
        stopScan();
    }
}

function stopScan() {
    isScanning = false;
    updateConnectionStatus('ready');
    scanBtn.textContent = 'Scan Devices';
    scanBtn.disabled = false;
}

function connectDevice(deviceId) {
    // For now, the Python script will auto-connect to the first device found
    // In a more advanced version, we could send commands to the Python process
    logMessage(`Attempting to connect to ${deviceId}...`, 'device');
}

function disconnectDevice(deviceId) {
    // For now, we can't easily disconnect from the Python script
    // This would require more complex inter-process communication
    logMessage(`Disconnect not implemented for ${deviceId}`, 'system');
}

// Event listeners
scanBtn.addEventListener('click', startScan);

// Initialize
logMessage('ESP32 Streamdeck Monitor started', 'system');
startPythonProcess();
