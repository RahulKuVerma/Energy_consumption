import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ForecastPage from './pages/ForecastPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import DatasetLibraryPage from './pages/DatasetLibraryPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import ModelsPage from './pages/ModelsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import { api, DEFAULT_SYSTEM_SETTINGS } from './services/api.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => {
    const savedId = Number(localStorage.getItem('activeDatasetId'));
    return Number.isInteger(savedId) && savedId > 0 ? savedId : null;
  });
  const [activeDataset, setActiveDataset] = useState(null);
  const [selectedModel, setSelectedModel] = useState('xgboost');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [systemSettings, setSystemSettings] = useState(DEFAULT_SYSTEM_SETTINGS);

  useEffect(() => {
    document.documentElement.dataset.theme = systemSettings.theme;
  }, [systemSettings.theme]);

  useEffect(() => {
    if (!selectedDatasetId) {
      setActiveDataset(null);
      return;
    }

    api.getDataset(selectedDatasetId)
      .then(setActiveDataset)
      .catch(() => {
        setActiveDataset(null);
        setSelectedDatasetId(null);
        localStorage.removeItem('activeDatasetId');
      });
  }, [selectedDatasetId]);

  const selectDataset = (datasetId) => {
    const id = Number(datasetId);
    if (!Number.isInteger(id) || id < 1) return;
    localStorage.setItem('activeDatasetId', String(id));
    setSelectedDatasetId(id);
  };

  // Check backend health on mount
  useEffect(() => {
    api.getHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
    api.getSettings()
      .then((savedSettings) => {
        setSystemSettings(savedSettings);
        setSelectedModel(savedSettings.default_model);
      })
      .catch((error) => console.error('Settings load error:', error));
  }, []);

  const saveSettings = async (nextSettings) => {
    const savedSettings = await api.saveSettings(nextSettings);
    setSystemSettings(savedSettings);
    setSelectedModel(savedSettings.default_model);
    return savedSettings;
  };

  const selectModel = async (model) => {
    const savedSettings = await api.saveSettings({
      ...systemSettings,
      default_model: model,
    });
    setSystemSettings(savedSettings);
    setSelectedModel(savedSettings.default_model);
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            selectedDatasetId={selectedDatasetId}
            activeDataset={activeDataset}
            selectedModel={selectedModel}
            settings={systemSettings}
            onSelectModel={selectModel}
          />
        );
      case 'forecast':
        return (
          <ForecastPage
            selectedDatasetId={selectedDatasetId}
            activeDataset={activeDataset}
            selectedModel={selectedModel}
            settings={systemSettings}
            onSelectModel={setSelectedModel}
          />
        );
      case 'upload':
        return (
          <UploadPage
            defaultResampleFreq={systemSettings.resample_freq}
            onDatasetLoaded={(id) => {
              selectDataset(id);
              setActiveTab('dashboard');
            }}
          />
        );
      case 'datasets':
        return (
          <DatasetLibraryPage
            selectedDatasetId={selectedDatasetId}
            onSelectDataset={selectDataset}
            onOpenDashboard={() => setActiveTab('dashboard')}
            onOpenUpload={() => setActiveTab('upload')}
          />
        );
      case 'analytics':
        return <AnalyticsPage selectedDatasetId={selectedDatasetId} activeDataset={activeDataset} settings={systemSettings} />;
      case 'models':
        return (
          <ModelsPage
            activeModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
        );
      case 'settings':
        return <SettingsPage initialSettings={systemSettings} onSaveSettings={saveSettings} />;
      default:
        return <DashboardPage selectedDatasetId={selectedDatasetId} selectedModel={selectedModel} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      <div className="main-content">
        <Navbar
          backendStatus={backendStatus}
          activeTab={activeTab}
          selectedDatasetId={selectedDatasetId}
          activeDataset={activeDataset}
        />
        <main className="page-wrapper">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
