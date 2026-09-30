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
import UsersPage from './pages/UsersPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { api, DEFAULT_SYSTEM_SETTINGS } from './services/api.js';

export default function App() {
  const [authLoading, setAuthLoading] = useState(Boolean(localStorage.getItem('accessToken')));
  const [currentUser, setCurrentUser] = useState(null);
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
    if (!localStorage.getItem('accessToken')) return;
    api.getCurrentUser()
      .then((user) => {
        setCurrentUser(user);
        setActiveTab(user.role === 'admin' ? 'dashboard' : 'datasets');
      })
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = systemSettings.theme;
  }, [systemSettings.theme]);

  useEffect(() => {
    if (!currentUser) return;
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
  }, [selectedDatasetId, currentUser]);

  const selectDataset = (datasetId) => {
    const id = Number(datasetId);
    if (!Number.isInteger(id) || id < 1) return;
    localStorage.setItem('activeDatasetId', String(id));
    setSelectedDatasetId(id);
  };

  useEffect(() => {
    api.getHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    api.getSettings()
      .then((savedSettings) => {
        setSystemSettings(savedSettings);
        setSelectedModel(savedSettings.default_model);
      })
      .catch((error) => console.error('Settings load error:', error));
  }, [currentUser]);

  const handleAuthenticated = (user) => {
    setCurrentUser(user);
    setActiveTab(user.role === 'admin' ? 'dashboard' : 'datasets');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('activeDatasetId');
    setCurrentUser(null);
    setSelectedDatasetId(null);
    setActiveTab('dashboard');
  };

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
            userRole={currentUser?.role}
            onOpenDatasets={() => setActiveTab('datasets')}
          />
        );
      case 'upload':
        return (
          <UploadPage
            defaultResampleFreq={systemSettings.resample_freq}
            userRole={currentUser?.role}
            onDatasetLoaded={(id) => {
              selectDataset(id);
              setActiveTab(currentUser?.role === 'admin' ? 'dashboard' : 'forecast');
            }}
          />
        );
      case 'datasets':
        return (
          <DatasetLibraryPage
            selectedDatasetId={selectedDatasetId}
            onSelectDataset={selectDataset}
            userRole={currentUser?.role}
            onOpenDashboard={() => setActiveTab(currentUser?.role === 'admin' ? 'dashboard' : 'forecast')}
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
            userRole={currentUser?.role}
          />
        );
      case 'settings':
        return <SettingsPage initialSettings={systemSettings} onSaveSettings={saveSettings} />;
      case 'users':
        return currentUser?.role === 'admin' ? <UsersPage /> : null;
      default:
        return <DashboardPage selectedDatasetId={selectedDatasetId} selectedModel={selectedModel} />;
    }
  };

  if (authLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>Checking session…</div>;
  if (!currentUser) return <LoginPage onAuthenticated={handleAuthenticated} />;

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} role={currentUser.role} username={currentUser.username} onLogout={handleLogout} />
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
