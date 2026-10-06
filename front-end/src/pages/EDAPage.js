import { useEffect, useMemo, useState } from 'react';
import { fetchEdaSummary } from '../services/eda';
import './EDAPage.css';

function formatCount(value) {
  return new Intl.NumberFormat().format(value);
}

function FeaturePieChart({ bins, label }) {
  const total = bins.reduce((sum, { count }) => sum + count, 0);
  const colors = ['#1e3a8a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];
  let angle = 0;
  const slices = bins.map((bin, index) => {
    const percent = total ? (bin.count / total) * 100 : 0;
    const start = angle;
    angle += percent * 3.6;
    return { ...bin, color: colors[index % colors.length], percent, start, end: angle };
  });
  const gradient = slices
    .filter(({ count }) => count > 0)
    .map(({ color, start, end }) => `${color} ${start}deg ${end}deg`)
    .join(', ');

  return (
    <div className="eda-feature-visual">
      <div
        className="eda-pie-chart"
        role="img"
        aria-label={`${label} distribution pie chart`}
        style={{ background: gradient ? `conic-gradient(${gradient})` : '#e2e8f0' }}
      />
      <ul className="eda-feature-legend" aria-label={`${label} values`}>
        {slices.map(({ label: binLabel, count, color, percent }) => (
          <li key={binLabel} title={`${binLabel}: ${formatCount(count)} (${percent.toFixed(1)}%)`}>
            <span className="eda-legend-swatch" style={{ backgroundColor: color }} aria-hidden="true" />
            <span className="eda-legend-label">{binLabel}</span>
            <strong>{percent.toFixed(1)}%</strong>
            <small>{formatCount(count)}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DatasetOverview({ overview }) {
  const cards = [
    { label: 'Encounters', value: formatCount(overview.records), detail: 'patient visits' },
    { label: 'Dataset columns', value: formatCount(overview.columns), detail: `${formatCount(overview.features)} non-target fields` },
    { label: 'Readmission classes', value: formatCount(overview.targetClasses), detail: 'outcome groups' },
    { label: 'Missing cells', value: formatCount(overview.missingCells), detail: 'in the source dataset' }
  ];

  return (
    <section className="eda-overview" aria-label="Dataset overview">
      {cards.map(({ label, value, detail }) => (
        <article className="eda-overview-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{detail}</small>
        </article>
      ))}
    </section>
  );
}

function TargetDistribution({ target }) {
  const maximum = Math.max(...target.map(({ count }) => count), 1);

  return (
    <div className="eda-target-list">
      {target.map(({ value, label, count, percent }) => (
        <div className="eda-target-row" key={value} title={`${label}: ${formatCount(count)} (${percent}%)`}>
          <div className="eda-target-copy">
            <span>{label}</span>
            <strong>{formatCount(count)} <small>({percent}%)</small></strong>
          </div>
          <div className="eda-target-track">
            <span style={{ width: `${(count / maximum) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CorrelationMatrix({ correlations }) {
  const { labels, matrix } = correlations;

  return (
    <div
      className="eda-heatmap"
      role="table"
      aria-label="Pearson correlation matrix"
      style={{ '--eda-matrix-size': labels.length }}
    >
      <span className="eda-heatmap-corner" role="columnheader" />
      {labels.map((label) => (
        <span className="eda-heatmap-heading" role="columnheader" key={`col-${label}`}>{label}</span>
      ))}
      {matrix.map((row, rowIndex) => (
        <div className="eda-heatmap-row" role="row" key={`row-${labels[rowIndex]}`}>
          <span className="eda-heatmap-row-label" role="rowheader">{labels[rowIndex]}</span>
          {row.map((value, columnIndex) => {
            const opacity = 0.08 + Math.abs(value) * 0.82;
            return (
              <span
                className="eda-heatmap-cell"
                role="cell"
                key={`${rowIndex}-${columnIndex}`}
                title={`${labels[rowIndex]} and ${labels[columnIndex]}: r = ${value}`}
                style={{ backgroundColor: `rgba(30, 58, 138, ${opacity})`, color: opacity > 0.52 ? '#ffffff' : '#1e3a8a' }}
              >
                {value.toFixed(2)}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function EDAPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState('readmitted');

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      setLoading(true);
      setError('');
      try {
        setSummary(await fetchEdaSummary(controller.signal));
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadSummary();
    return () => controller.abort();
  }, []);

  const feature = useMemo(
    () => summary?.features.find(({ key }) => key === selectedFeature),
    [summary, selectedFeature]
  );

  return (
    <main className="eda-page">
      <header className="eda-page-header">
        <div>
          <p className="eda-eyebrow">Dataset exploration</p>
          <h1>Exploratory Data Analysis</h1>
          <p>Explore the dataset, understand feature distributions, and identify relationships in the data.</p>
        </div>
        {summary && <span className="eda-source">Source: {summary.source}</span>}
      </header>

      {loading && <p className="eda-state-message" role="status">Loading dataset analysis…</p>}

      {!loading && error && (
        <section className="eda-error" role="alert">
          <h2>Dataset analysis is unavailable</h2>
          <p>{error}</p>
        </section>
      )}

      {!loading && summary && (
        <>
          <DatasetOverview overview={summary.overview} />

          <section className="eda-primary-grid">
            <article className="eda-panel">
              <div className="eda-panel-heading">
                <div>
                  <h2>Readmission distribution</h2>
                  <p>Encounter outcome recorded in the source dataset.</p>
                </div>
              </div>
              <TargetDistribution target={summary.target} />
              <p className="eda-panel-note">
                The prediction model treats “readmitted within 30 days” as its positive class; the other two outcomes are grouped as not within 30 days.
              </p>
            </article>

            <article className="eda-panel">
              <div className="eda-panel-heading eda-feature-heading">
                <div>
                  <h2>Feature breakdown</h2>
                  <p>Explore the same categorical features plotted in the source notebook.</p>
                </div>
                <label className="eda-feature-select">
                  <span>Select feature</span>
                  <select value={selectedFeature} onChange={(event) => setSelectedFeature(event.target.value)}>
                    {summary.features.map(({ key, label }) => <option value={key} key={key}>{label}</option>)}
                  </select>
                </label>
              </div>
              {feature && (
                <>
                  <h3 className="eda-pie-title">Pie chart of {feature.label}</h3>
                  <FeaturePieChart bins={feature.bins} label={feature.label} />
                </>
              )}
            </article>
          </section>

          <section className="eda-panel eda-correlation-panel">
            <div className="eda-panel-heading">
              <div>
                <h2>Correlation analysis</h2>
                <p>Correlation shows the strength and direction of relationships between numerical variables.</p>
              </div>
              <span className="eda-correlation-key">Pearson r: −1 to +1</span>
            </div>
            <CorrelationMatrix correlations={summary.correlations} />
          </section>

          <section className="eda-panel eda-insights-panel">
            <div className="eda-panel-heading">
              <div>
                <h2>Key insights</h2>
                <p>Observations calculated from the loaded dataset.</p>
              </div>
            </div>
            <ul className="eda-insights">
              {summary.insights.map((insight) => <li key={insight}>{insight}</li>)}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

export default EDAPage;
