export const formatPower = (kw) => {
  if (kw === undefined || kw === null || isNaN(kw)) return '0.00 kW';
  return `${Number(kw).toFixed(2)} kW`;
};

export const formatEnergy = (kwh) => {
  if (kwh === undefined || kwh === null || isNaN(kwh)) return '0.00 kWh';
  return `${Number(kwh).toFixed(2)} kWh`;
};

export const formatCurrency = (amount, currency = 'USD') => {
  const symbol = { USD: '$', EUR: '€', GBP: '£', INR: '₹' }[currency] || '$';
  if (amount === undefined || amount === null || isNaN(amount)) return `${symbol}0.00`;
  return `${symbol}${Number(amount).toFixed(2)}`;
};

export const formatCarbon = (kg) => {
  if (kg === undefined || kg === null || isNaN(kg)) return '0.0 kg';
  return `${Number(kg).toFixed(1)} kg CO₂`;
};

export const formatPercent = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0.0%';
  return `${Number(val).toFixed(1)}%`;
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const formatTimeOnly = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const parts = dateStr.split(' ');
    return parts.length > 1 ? parts[1].substring(0, 5) : dateStr;
  }
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};
