# Electron Title Bar Implementation

## Changes Made

This update adds a custom title bar to the Electron application with window controls (minimize, maximize/restore, close) and drag functionality.

### Files Modified:

1. **app/electron/main.ts**
   - Updated window configuration to use frameless window
   - Added IPC handlers for window controls (minimize, maximize, close)
   - Set proper window properties for custom title bar

2. **app/electron/preload.ts**
   - Added window control methods to the electron API
   - Exposed minimize, maximize, and close functions to the renderer

3. **app/src/components/Layout/TitleBar.tsx** (NEW)
   - Custom title bar component with drag region
   - Window control buttons with hover effects
   - Proper styling to match the app theme

4. **app/src/App.tsx**
   - Integrated the TitleBar component at the top of the app
   - Adjusted layout structure to accommodate the title bar

5. **app/src/components/Layout/Sidebar.tsx**
   - Updated height from `h-screen` to `h-full` to work with new layout

6. **app/src/types/electron.d.ts**
   - Added type definitions for the new window control methods

7. **app/src/index.css**
   - Added CSS classes for drag regions
   - Ensured proper window frame behavior

### Features:

- **Draggable title bar**: Click and drag the title area to move the window
- **Minimize button**: Minimizes the window to the taskbar
- **Maximize/Restore button**: Toggles between maximized and restored window states
- **Close button**: Closes the application
- **Visual feedback**: Hover effects on all buttons
- **Theme consistency**: Matches the existing dark theme

### Usage:

The title bar is automatically included at the top of the application. Users can:
- Drag the window by clicking and dragging the title area
- Use the three buttons on the right to control the window state
- The close button has a red hover effect for clear visual feedback

### Technical Notes:

- Uses `-webkit-app-region: drag` for the draggable area
- Uses `-webkit-app-region: no-drag` for the control buttons
- IPC communication between renderer and main process for window controls
- Frameless window configuration in Electron for custom appearance
