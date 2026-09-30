const API_BASE = '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errMessage = `Error ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) errMessage = errorJson.detail;
    } catch (_) {}
    throw new Error(errMessage);
  }

  return res.json();
}

export const DEFAULT_SYSTEM_SETTINGS = {
  theme: 'dark',
  peak_threshold_kw: 4.5,
  anomaly_zscore_threshold: 2.5,
  kwh_rate: 0.18,
  co2_factor: 0.233,
  default_model: 'xgboost',
  default_horizon: 24,
  resample_freq: '1h',
  alerts_enabled: true,
  currency: 'USD',
};

export const api = {
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }),
  register: (username, password) => request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }),
  getCurrentUser: () => request('/auth/me'),
  getUsers: () => request('/auth/users'),
  resetUserPassword: (userId, password) => request(`/auth/users/${userId}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }),

  // Health & Status
  getHealth: () => request('/health'),
  getSettings: () => request('/settings'),
  saveSettings: (settings) => request('/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  }),

  // Analytics
  getAnalyticsSummary: (datasetId) => 
    request(`/analytics/summary${datasetId ? `?dataset_id=${datasetId}` : ''}`),
  getAnomalies: (threshold = 2.5, datasetId = null) =>
    request(`/analytics/anomalies?threshold=${threshold}${datasetId ? `&dataset_id=${datasetId}` : ''}`),

  // Datasets
  getDatasets: () => request('/datasets'),
  getDataset: (datasetId) => request(`/datasets/${datasetId}`),
  getDatasetReadings: (datasetId, page = 1, pageSize = 50) => 
    request(`/datasets/${datasetId}/readings?page=${page}&page_size=${pageSize}`),
  deleteDataset: (datasetId) => 
    request(`/datasets/${datasetId}`, { method: 'DELETE' }),

  // Ingestion & Processing
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/upload/file', {
      method: 'POST',
      body: formData,
    });
  },

  processDataset: async (filePath, datasetName, columnMapping, resampleFreq = '1h') => {
    const formData = new FormData();
    formData.append('file_path', filePath);
    formData.append('dataset_name', datasetName);
    formData.append('column_mapping', JSON.stringify(columnMapping));
    formData.append('resample_freq', resampleFreq);
    return request('/upload/process', {
      method: 'POST',
      body: formData,
    });
  },

  // Models
  getModels: () => request('/models'),
  compareModels: () => request('/models/compare'),
  trainModels: (datasetId) => request('/models/train', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id: datasetId }),
  }),
  setModelPublication: (modelId, isPublished) => request(`/models/${modelId}/publication`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_published: isPublished }),
  }),

  // Forecasting
  createForecast: (modelName, horizonHours = 24, datasetId = null) => 
    request('/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_name: modelName,
        horizon_hours: horizonHours,
        dataset_id: datasetId,
      }),
    }),
  getQuickForecast: (modelName = 'xgboost', horizon = 24, datasetId = null) =>
    request(`/forecast/quick?model=${modelName}&horizon=${horizon}${datasetId ? `&dataset_id=${datasetId}` : ''}`),
  getForecastHistory: () => request('/forecast/history'),
  getForecastDetail: (id) => request(`/forecast/${id}`),

  // Alerts
  getAlerts: (resolved = null) => 
    request(`/alerts${resolved !== null ? `?resolved=${resolved}` : ''}`),
  getAlertsSummary: () => request('/alerts/summary'),
  resolveAlert: (alertId) => 
    request(`/alerts/${alertId}/resolve`, { method: 'POST' }),

  // Natural Language Query
  askQuery: (query, modelName = 'xgboost', datasetId = null) => 
    request('/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        model_name: modelName,
        dataset_id: datasetId,
      }),
    }),
};
