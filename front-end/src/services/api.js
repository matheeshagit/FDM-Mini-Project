const API_URL = process.env.REACT_APP_API_URL || '';

function normalizePrediction(data) {
  const value = data.readmission_flag ?? data.prediction ?? data.label;

  if (value === 1 || value === true || value === '1') return 1;
  if (value === 0 || value === false || value === '0') return 0;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'readmitted within 30 days' || normalized === 'high risk of readmission' || normalized === 'high risk (<30 days readmission)') return 1;
    if (normalized === 'not readmitted within 30 days' || normalized === 'low risk of readmission' || normalized === 'low/standard risk') return 0;
  }

  throw new Error('The prediction service returned an unsupported response.');
}

export async function predictReadmission(patientData) {
  let response;

  try {
    response = await fetch(`${API_URL.replace(/\/$/, '')}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
  } catch {
    throw new Error('Could not connect to the prediction service. Check that the backend is running and try again.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || 'The prediction service could not process this request.');
  }
  if (!data || typeof data !== 'object') {
    throw new Error('The prediction service returned an invalid response.');
  }

  const probabilityValue = data.readmission_probability ?? data.probability;
  const probability = typeof probabilityValue === 'number'
    && Number.isFinite(probabilityValue)
    && probabilityValue >= 0
    && probabilityValue <= 1
    ? probabilityValue
    : null;

  return { prediction: normalizePrediction(data), probability };
}