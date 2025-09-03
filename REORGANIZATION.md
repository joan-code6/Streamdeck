# 🎮 ESP32 Streamdeck Project

> **Status:** ✅ Reorganized and Ready for Development

## 📋 What's Been Improved

### ✅ **Clean Folder Structure**
- **`app/`** - Main Electron application (React + TypeScript + Vite)
- **`backend/`** - Python BLE communication services
- **`firmware/`** - ESP32 Arduino code
- **`assets/`** - Shared project assets

### ✅ **Simplified Workflow**
- **One-command setup:** `setup.bat` or `npm run setup`
- **Easy development:** `npm run dev` for hot-reload development
- **Quick start:** `run.bat` starts both backend and frontend

### ✅ **Better Documentation**
- Clear README files in each folder
- Updated main documentation
- Setup instructions for all components

## 🚀 How to Use Your Reorganized Project

### First Time Setup
```bash
# Run the setup script
setup.bat

# Or manually:
npm run setup
```

### Daily Development
```bash
# Start everything (recommended)
npm start

# Or start components separately:
npm run backend    # Python BLE backend only
npm run dev        # Electron app in development mode
```

### Building for Production
```bash
npm run build
```

## 📁 What Was Moved/Removed

### ✅ **Moved:**
- `web/*` → `app/*` (main Electron application)
- `web/scripts/*` → `backend/*` (Python backend)
- `web/configs/*` → `backend/*` (configuration files)
- `esp32-side/esp32-side.ino` → `firmware/streamdeck.ino`

### ❌ **Removed:**
- Duplicate `main.js`, `renderer.js`, `index.html` from root
- Old `package.json` (replaced with workspace configuration)
- Empty directories

### 📝 **Updated:**
- Root `package.json` now manages the entire workspace
- `run.bat` now starts both backend and frontend
- `.gitignore` updated for new structure
- All documentation updated

## 🎯 Next Steps

1. **Test the setup:** Run `setup.bat` to ensure everything works
2. **Start developing:** Use `npm run dev` for hot-reload development  
3. **Flash firmware:** Upload `firmware/streamdeck.ino` to your ESP32
4. **Start building:** Your project is now properly organized for development!

---
*Project reorganized for better maintainability and development workflow* 🚀
