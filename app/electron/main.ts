import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Keep a global reference of the window object
let mainWindow: BrowserWindow;

const isDev = process.env.NODE_ENV === 'development';

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
    titleBarStyle: 'hiddenInset',
    frame: false, // Remove window frame completely
    show: false,
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
app.whenReady().then(() => {
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

ipcMain.handle('start-bluetooth-scanning', async () => {
  if (bluetoothProcess) {
    bluetoothProcess.kill();
  }

  return new Promise((resolve, reject) => {
    try {
      const scriptPath = path.join(__dirname, '../../backend/bluetooth_scanner.py');
      const workingDir = path.join(__dirname, '../../backend');
      
      console.log('Starting Python scanner...');
      console.log('Script path:', scriptPath);
      console.log('Working directory:', workingDir);
      
      bluetoothProcess = spawn('python', [scriptPath], {
        cwd: workingDir
      });

      bluetoothProcess.stdout.on('data', (data: Buffer) => {
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
    const python = spawn('python', [
      path.join(__dirname, '../../backend/save_config.py'), 
      deviceId, 
      JSON.stringify(config)
    ], {
      cwd: path.join(__dirname, '../../backend')
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
    const python = spawn('python', [
      path.join(__dirname, '../../backend/load_config.py'), 
      deviceId
    ], {
      cwd: path.join(__dirname, '../../backend')
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