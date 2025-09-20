import React, { useState } from 'react';
import { DeviceProvider } from './contexts/DeviceContext';
import { TitleBar } from './components/Layout/TitleBar';
import { Sidebar } from './components/Layout/Sidebar';
import { Home } from './components/Pages/Home';
import { AddDevice } from './components/Pages/AddDevice';
import { ManageDevice } from './components/Pages/ManageDevice';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'add-device':
        return <AddDevice />;
      case 'manage-device':
        return <ManageDevice />;
      default:
        return <Home />;
    }
  };

  return (
    <DeviceProvider>
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </DeviceProvider>
  );
}

export default App;