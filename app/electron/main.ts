import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Keep a global reference of the window object
let mainWindow: BrowserWindow;

const isDev = process.env.NODE_ENV === 'development';

function getBackendPath(): { scriptPath: (script: string) => string; workingDir: string } {
  const isPackaged = app.isPackaged;
  const basePath = isPackaged ? path.join(process.resourcesPath, 'backend') : path.join(__dirname, '../../backend');
  
  return {
    scriptPath: (script: string) => path.join(basePath, script),
    workingDir: basePath
  };
}

function checkPythonInstallation(): Promise<boolean> {
  return new Promise((resolve) => {
    const pythonCommands = ['python', 'python3', 'py'];
    
    const tryCommand = (index: number) => {
      if (index >= pythonCommands.length) {
        resolve(false);
        return;
      }
      
      const command = pythonCommands[index];
      const pythonProcess = spawn(command, ['--version'], { stdio: 'pipe' });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`Python found with command: ${command}`);
          pythonCommand = command;
          resolve(true);
        } else {
          tryCommand(index + 1);
        }
      });
      
      pythonProcess.on('error', () => {
        tryCommand(index + 1);
      });
    };
    
    tryCommand(0);
  });
}

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../electron/preload.js'),
    },
    frame: false, // Remove window frame completely
    titleBarStyle: 'hidden', // Hide title bar on macOS
    show: false,
    resizable: true,
    backgroundColor: '#1f2937', // Match the app's gray-800 color
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Check for Python installation
  const pythonAvailable = await checkPythonInstallation();
  
  if (!pythonAvailable) {
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Python Required',
      'This application requires Python to be installed.\n\nPlease install Python 3.8 or higher from https://python.org and restart the application.\n\nMake sure Python is added to your PATH environment variable.'
    );
    app.quit();
    return;
  }

  // Hide the menu bar completely
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for Python backend communication
let bluetoothProcess: any = null;
let pythonCommand: string = 'python';

ipcMain.handle('start-bluetooth-scanning', async () => {
  if (bluetoothProcess) {
    bluetoothProcess.kill();
  }

  return new Promise((resolve, reject) => {
    try {
      const backend = getBackendPath();
      const scriptPath = backend.scriptPath('bluetooth_scanner.py');
      const workingDir = backend.workingDir;
      
      console.log('Starting Python scanner...');
      console.log('Is packaged:', app.isPackaged);
      console.log('Script path:', scriptPath);
      console.log('Working directory:', workingDir);
      console.log('Python command:', pythonCommand);
      
      // Check if script file exists
      const fs = require('fs');
      if (!fs.existsSync(scriptPath)) {
        console.error('Script file does not exist:', scriptPath);
        reject(new Error(`Script file not found: ${scriptPath}`));
        return;
      }
      
      bluetoothProcess = spawn(pythonCommand, [scriptPath], {
        cwd: workingDir
      });

      let startupTimeout = setTimeout(() => {
        console.error('Python process startup timeout');
        bluetoothProcess.kill();
        reject(new Error('Python process failed to start'));
      }, 5000);

      bluetoothProcess.stdout.on('data', (data: Buffer) => {
        clearTimeout(startupTimeout);
        const lines = data.toString().split('\n').filter(line => line.trim());
        console.log('Python output:', data.toString());
        
        for (const line of lines) {
          try {
            const deviceData = JSON.parse(line);
            console.log('Parsed device data:', deviceData);
            
            // Send device updates to renderer
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('device-update', deviceData);
            }
          } catch (e) {
            console.log('Non-JSON line from Python:', line);
          }
        }
      });

      bluetoothProcess.stderr.on('data', (data: Buffer) => {
        console.error('Bluetooth scanner error:', data.toString());
      });

      bluetoothProcess.on('close', (code: number) => {
        console.log(`Bluetooth scanner exited with code ${code}`);
        bluetoothProcess = null;
      });

      bluetoothProcess.on('error', (error: Error) => {
        console.error('Failed to start bluetooth scanner:', error);
        reject(error);
      });

      // Resolve immediately after starting
      resolve({ success: true });
      
    } catch (error) {
      console.error('Exception starting bluetooth scanner:', error);
      reject(error);
    }
  });
});

ipcMain.handle('stop-bluetooth-scanning', async () => {
  if (bluetoothProcess) {
    bluetoothProcess.kill();
    bluetoothProcess = null;
  }
  return { success: true };
});

ipcMain.handle('save-device-config', async (_event, deviceId: string, config: any) => {
  return new Promise((resolve, reject) => {
    const backend = getBackendPath();
    const python = spawn('python', [
      backend.scriptPath('save_config.py'), 
      deviceId, 
      JSON.stringify(config)
    ], {
      cwd: backend.workingDir
    });
    
    let result = '';
    let error = '';

    python.stdout.on('data', (data) => {
      result += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(result));
        } catch {
          resolve({ success: true });
        }
      } else {
        reject(new Error(error));
      }
    });
  });
});

ipcMain.handle('load-device-config', async (_event, deviceId: string) => {
  return new Promise((resolve, reject) => {
    const backend = getBackendPath();
    const python = spawn('python', [
      backend.scriptPath('load_config.py'), 
      deviceId
    ], {
      cwd: backend.workingDir
    });
    
    let result = '';
    let error = '';

    python.stdout.on('data', (data) => {
      result += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(result));
        } catch {
          resolve({});
        }
      } else {
        reject(new Error(error));
      }
    });
  });
});

// Hotkey execution
ipcMain.handle('execute-hotkey', async (_event, hotkeyString: string, holdDuration?: number) => {
  console.log('Executing hotkey:', hotkeyString, 'with duration:', holdDuration);
  
  return new Promise((resolve, reject) => {
    const backend = getBackendPath();
    const scriptPath = backend.scriptPath('hotkey_executor.py');
    console.log('Script path:', scriptPath);
    
    const args = [scriptPath, hotkeyString];
    
    if (holdDuration !== undefined) {
      args.push(holdDuration.toString());
    }
    
    console.log('Python args:', args);
    
    const python = spawn('python', args, {
      cwd: backend.workingDir
    });
    
    let result = '';
    let error = '';

    python.stdout.on('data', (data) => {
      result += data.toString();
      console.log('Python stdout:', data.toString());
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
      console.log('Python stderr:', data.toString());
    });

    python.on('close', (code) => {
      console.log('Python process exited with code:', code);
      
      if (code === 0) {
        try {
          const parsed = JSON.parse(result);
          console.log('Parsed result:', parsed);
          resolve(parsed);
        } catch (parseError) {
          console.log('JSON parse error, raw result:', result);
          resolve({ success: true, raw: result });
        }
      } else {
        console.log('Python error:', error);
        reject(new Error(error || 'Unknown error'));
      }
    });

    python.on('error', (err) => {
      console.log('Python spawn error:', err);
      reject(err);
    });
  });
});

// Window control handlers
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('toggle-maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('is-window-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});