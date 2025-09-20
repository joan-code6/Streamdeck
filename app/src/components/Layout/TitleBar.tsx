import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check initial maximize state
    const checkMaximized = async () => {
      if (window.electronAPI?.isWindowMaximized) {
        const maximized = await window.electronAPI.isWindowMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = async () => {
    await window.electronAPI?.toggleMaximizeWindow();
    // Update the state after toggling
    if (window.electronAPI?.isWindowMaximized) {
      const maximized = await window.electronAPI.isWindowMaximized();
      setIsMaximized(maximized);
    }
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  return (
    <div className="flex justify-between items-center h-8 bg-gray-800 text-white select-none border-b border-gray-700">
      {/* Draggable area */}
      <div className="flex-1 h-full flex items-center px-4 drag-region cursor-move">
        <span className="text-sm font-medium text-gray-300">Stream Deck Controller</span>
      </div>
      
      {/* Window controls */}
      <div className="flex h-full no-drag-region">
        <button
          onClick={handleMinimize}
          className="px-4 h-full hover:bg-gray-700 transition-colors duration-150 flex items-center justify-center group"
          aria-label="Minimize"
          title="Minimize"
        >
          <Minus className="w-3 h-3 text-gray-400 group-hover:text-white" />
        </button>
        
        <button
          onClick={handleMaximize}
          className="px-4 h-full hover:bg-gray-700 transition-colors duration-150 flex items-center justify-center group"
          aria-label="Maximize/Restore"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 text-gray-400 group-hover:text-white" />
          ) : (
            <Square className="w-3 h-3 text-gray-400 group-hover:text-white" />
          )}
        </button>
        
        <button
          onClick={handleClose}
          className="px-4 h-full hover:bg-red-600 transition-colors duration-150 flex items-center justify-center group"
          aria-label="Close"
          title="Close"
        >
          <X className="w-3 h-3 text-gray-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};
