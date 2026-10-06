const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export async function fetchEdaSummary(signal) {
  let response;

  try {
    response = await fetch(`${API_URL.replace(/\/$/, '')}/eda/summary`, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Could not connect to the EDA data service. Check that the backend is running.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || 'The EDA data service could not load the dataset summary.');
  }
  if (
    !data
    || typeof data !== 'object'
    || !Array.isArray(data.features)
    || !Array.isArray(data.target)
    || !Array.isArray(data.numericDistributions)
  ) {
    throw new Error('The EDA data service returned an invalid dataset summary.');
  }

  return data;
}
