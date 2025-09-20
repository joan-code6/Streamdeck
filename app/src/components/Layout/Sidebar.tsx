import React from 'react';
import { Home, Plus, Settings, Cpu } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'home', label: 'Überblick', icon: Home },
    { id: 'add-device', label: 'Gerät hinzufügen', icon: Plus },
    { id: 'manage-device', label: 'Gerät verwalten', icon: Settings },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold">Stream Deck</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          DIY Stream Deck v1.0
        </div>
      </div>
    </div>
  );
};