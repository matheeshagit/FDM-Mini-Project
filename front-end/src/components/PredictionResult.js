function PredictionResult({ result }) {
  if (!result) {
    return (
      <section className="result-panel result-panel--empty" aria-live="polite" aria-atomic="true">
        <div className="result-icon" aria-hidden="true">—</div>
        <div className="result-copy">
          <p className="eyebrow">Prediction result</p>
          <h2>No prediction yet</h2>
          <p className="result-message">The result will appear here.</p>
        </div>
      </section>
    );
  }

  const isPositive = result.prediction === 1;
  const probability = result.probability;

  return (
    <section className={`result-panel ${isPositive ? 'result-panel--positive' : 'result-panel--negative'}`} aria-live="polite" aria-atomic="true">
      <div className="result-icon" aria-hidden="true">{isPositive ? '!' : '✓'}</div>
      <div className="result-copy">
        <p className="eyebrow">Prediction result</p>
        <h2>{isPositive ? 'High Risk of Readmission' : 'Low Risk of Readmission'}</h2>
        <p className="result-message">
          {isPositive
            ? 'The model predicts that this patient is likely to be readmitted within 30 days.'
            : 'The model predicts that this patient is unlikely to be readmitted within 30 days.'}
        </p>
        <div className="result-outcome">
          <span>Prediction</span>
          <strong>{isPositive ? 'Readmitted within 30 days' : 'Not readmitted within 30 days'}</strong>
        </div>
        {probability !== null && (
          <div className="probability-block">
            <div className="probability-label">
              <span>Prediction probability</span>
              <strong>{Math.round(probability * 100)}%</strong>
            </div>
            <div className="probability-track" role="progressbar" aria-label="Prediction probability" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(probability * 100)}>
              <span style={{ width: `${probability * 100}%` }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PredictionResult;