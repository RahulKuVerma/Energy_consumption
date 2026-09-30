import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useForecast(initialModel = 'xgboost', initialHorizon = 24) {
  const [model, setModel] = useState(initialModel);
  const [horizon, setHorizon] = useState(initialHorizon);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const runForecast = useCallback(async (selectedModel = model, selectedHorizon = horizon, datasetId = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.createForecast(selectedModel, selectedHorizon, datasetId);
      setForecastData(data);
      // Refresh history
      const historyList = await api.getForecastHistory();
      setHistory(historyList);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to generate forecast.');
    } finally {
      setLoading(false);
    }
  }, [model, horizon]);

  useEffect(() => {
    runForecast(model, horizon);
  }, [model, horizon, runForecast]);

  return {
    model,
    setModel,
    horizon,
    setHorizon,
    forecastData,
    loading,
    error,
    history,
    runForecast,
  };
}
