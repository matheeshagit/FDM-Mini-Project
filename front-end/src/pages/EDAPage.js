import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchEdaSummary } from '../services/eda';
import './EDAPage.css';

function formatCount(value) {
  return new Intl.NumberFormat().format(value);
}

function getTooltipPosition(event, container, anchorBottom = false) {
  const bounds = container.getBoundingClientRect();
  const targetBounds = event.currentTarget.getBoundingClientRect();
  const hasPointerPosition = Number.isFinite(event.clientX)
    && Number.isFinite(event.clientY)
    && (event.clientX !== 0 || event.clientY !== 0);
  const pointerX = hasPointerPosition ? event.clientX : targetBounds.left + targetBounds.width / 2;
  const pointerY = hasPointerPosition ? event.clientY : targetBounds.top + targetBounds.height / 2;
  const tooltipWidth = Math.min(212, bounds.width - 16);
  const localY = pointerY - bounds.top;

  return {
    left: Math.max(8, Math.min(pointerX - bounds.left + 14, bounds.width - tooltipWidth - 8)),
    top: anchorBottom ? localY : Math.max(8, Math.min(localY + 14, bounds.height - 96)),
    width: tooltipWidth,
    transform: anchorBottom ? 'translateY(-100%)' : 'none'
  };
}

function ChartTooltip({ details, position }) {
  if (!details || !position) return null;

  return (
    <div className="eda-chart-tooltip" role="tooltip" style={position}>
      <strong>{details.title}</strong>
      <span>{details.value}</span>
      <small>{details.note}</small>
    </div>
  );
}

function pieSlicePath(startAngle, endAngle, radius, center) {
  if (endAngle - startAngle >= 359.999) {
    return `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius} Z`;
  }

  const startRadians = ((startAngle - 90) * Math.PI) / 180;
  const endRadians = ((endAngle - 90) * Math.PI) / 180;
  const startX = center + radius * Math.cos(startRadians);
  const startY = center + radius * Math.sin(startRadians);
  const endX = center + radius * Math.cos(endRadians);
  const endY = center + radius * Math.sin(endRadians);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

function FeaturePieChart({ bins, label }) {
  const chartRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const total = bins.reduce((sum, { count }) => sum + count, 0);
  const colors = ['#0047ab', '#1a2c5b', '#afdbf5', '#5b93d1', '#80b8e0', '#d7eefc'];
  let angle = 0;
  const slices = bins.map((bin, index) => {
    const percent = total ? (bin.count / total) * 100 : 0;
    const start = angle;
    angle += percent * 3.6;
    return { ...bin, color: colors[index % colors.length], percent, start, end: angle };
  });
  return (
    <div className="eda-feature-visual">
      <div className="eda-pie-wrap" ref={chartRef} onMouseLeave={() => setTooltip(null)}>
        <svg className="eda-pie-chart" viewBox="0 0 200 200" role="img" aria-label={`${label} distribution pie chart`}>
          {slices.filter(({ count }) => count > 0).map(({ label: binLabel, count, color, percent, start, end }) => {
            const showTooltip = (event) => setTooltip({
              position: getTooltipPosition(event, chartRef.current, true),
              details: {
                title: binLabel,
                value: `${formatCount(count)} encounters`,
                note: `${percent.toFixed(1)}% of ${label.toLowerCase()} records`
              }
            });

            return (
              <path
                className="eda-pie-slice"
                d={pieSlicePath(start, end, 100, 110)}
                fill={color}
                key={binLabel}
                tabIndex="0"
                aria-label={`${binLabel}: ${formatCount(count)} encounters, ${percent.toFixed(1)} percent`}
                onMouseEnter={showTooltip}
                onMouseMove={showTooltip}
                onMouseLeave={() => setTooltip(null)}
                onFocus={showTooltip}
                onBlur={() => setTooltip(null)}
              />
            );
          })}
        </svg>
        {tooltip && <ChartTooltip details={tooltip.details} position={tooltip.position} />}
      </div>
      <ul className="eda-feature-legend" aria-label={`${label} values`}>
        {slices.map(({ label: binLabel, count, color, percent }) => (
          <li key={binLabel}>
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
    { label: 'Duplicate rows', value: formatCount(overview.duplicateRows), detail: 'fully duplicated records' },
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
  const chartRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  return (
    <div
      className="eda-target-list"
      ref={chartRef}
      aria-label="Readmission outcome distribution"
      onMouseLeave={() => setTooltip(null)}
    >
      {target.map(({ value, label, count, percent }) => {
        const showTooltip = (event) => setTooltip({
          position: getTooltipPosition(event, chartRef.current, true),
          details: {
            title: label,
            value: `${formatCount(count)} encounters`,
            note: `${percent}% of readmission records`
          }
        });

        return (
          <div className="eda-target-row" key={value}>
            <div className="eda-target-copy">
              <span>{label}</span>
              <strong>{formatCount(count)} <small>({percent}%)</small></strong>
            </div>
            <div
              className="eda-target-track"
              role="img"
              tabIndex="0"
              aria-label={`${label}: ${formatCount(count)} encounters, ${percent}%`}
              onMouseEnter={showTooltip}
              onMouseMove={showTooltip}
              onMouseLeave={() => setTooltip(null)}
              onFocus={showTooltip}
              onBlur={() => setTooltip(null)}
            >
              <span style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
      {tooltip && <ChartTooltip details={tooltip.details} position={tooltip.position} />}
    </div>
  );
}

function formatAxisValue(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function NumericHistogram({ distribution }) {
  const chartRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const { histogram, label } = distribution;
  const width = 720;
  const height = 250;
  const left = 52;
  const right = 18;
  const top = 18;
  const bottom = 48;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const minimum = histogram[0].lower;
  const maximum = histogram[histogram.length - 1].upper;
  const range = maximum - minimum || 1;
  const maxCount = Math.max(...histogram.map(({ count }) => count), 1);
  const x = (value) => left + ((value - minimum) / range) * plotWidth;
  const y = (count) => top + plotHeight - (count / maxCount) * plotHeight;

  const total = histogram.reduce((sum, { count }) => sum + count, 0);

  return (
    <div className="eda-interactive-chart" ref={chartRef} onMouseLeave={() => setTooltip(null)}>
    <svg className="eda-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Histogram of ${label}`}>
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const count = Math.round(maxCount * fraction);
        const yPosition = y(count);
        return (
          <g key={fraction}>
            <line className="eda-chart-gridline" x1={left} x2={width - right} y1={yPosition} y2={yPosition} />
            <text className="eda-chart-tick" x={left - 8} y={yPosition + 4} textAnchor="end">{formatCount(count)}</text>
          </g>
        );
      })}
      {histogram.map(({ label: binLabel, count, lower, upper }) => {
        const barX = x(lower);
        const barWidth = Math.max(1, x(upper) - barX - 2);
        const percent = total ? (count / total) * 100 : 0;
        const showTooltip = (event) => setTooltip({
          position: getTooltipPosition(event, chartRef.current, true),
          details: {
            title: binLabel,
            value: `${formatCount(count)} encounters`,
            note: `${percent.toFixed(1)}% of ${label.toLowerCase()} records`
          }
        });

        return (
          <rect
            className="eda-histogram-bar"
            key={binLabel}
            x={barX + 1}
            y={y(count)}
            width={barWidth}
            height={Math.max(0, top + plotHeight - y(count))}
            rx="2"
            tabIndex="0"
            aria-label={`${label}, ${binLabel}: ${formatCount(count)} encounters, ${percent.toFixed(1)} percent`}
            onMouseEnter={showTooltip}
            onMouseMove={showTooltip}
            onFocus={showTooltip}
            onBlur={() => setTooltip(null)}
          >
          </rect>
        );
      })}
      <line className="eda-chart-axis" x1={left} x2={width - right} y1={top + plotHeight} y2={top + plotHeight} />
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
        <text
          className="eda-chart-tick"
          key={fraction}
          x={left + fraction * plotWidth}
          y={height - 17}
          textAnchor={fraction === 0 ? 'start' : fraction === 1 ? 'end' : 'middle'}
        >
          {formatAxisValue(minimum + fraction * range)}
        </text>
      ))}
      <text className="eda-chart-axis-label" x={left + plotWidth / 2} y={height - 2} textAnchor="middle">
        {label}
      </text>
    </svg>
    {tooltip && <ChartTooltip details={tooltip.details} position={tooltip.position} />}
    </div>
  );
}

function NumericBoxPlot({ distribution }) {
  const { label, stats } = distribution;
  const width = 720;
  const height = 190;
  const left = 52;
  const right = 18;
  const plotWidth = width - left - right;
  const minimum = stats.min;
  const maximum = stats.max;
  const range = maximum - minimum || 1;
  const x = (value) => left + ((value - minimum) / range) * plotWidth;
  const centerY = 70;
  const boxTop = 48;
  const boxHeight = 44;
  const axisY = 122;

  return (
    <>
      <svg className="eda-chart-svg eda-boxplot-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Box plot of ${label}`}>
        <line className="eda-boxplot-whisker" x1={x(stats.lowerWhisker)} x2={x(stats.upperWhisker)} y1={centerY} y2={centerY} />
        <line className="eda-boxplot-cap" x1={x(stats.lowerWhisker)} x2={x(stats.lowerWhisker)} y1={centerY - 13} y2={centerY + 13} />
        <line className="eda-boxplot-cap" x1={x(stats.upperWhisker)} x2={x(stats.upperWhisker)} y1={centerY - 13} y2={centerY + 13} />
        <rect
          className="eda-boxplot-box"
          x={x(stats.q1)}
          y={boxTop}
          width={Math.max(2, x(stats.q3) - x(stats.q1))}
          height={boxHeight}
          rx="4"
        />
        <line className="eda-boxplot-median" x1={x(stats.median)} x2={x(stats.median)} y1={boxTop} y2={boxTop + boxHeight} />
        {(stats.outlierSample || []).map((value, index) => {
          const jitter = ((index * 37) % 27) - 13;
          return (
            <circle
              className="eda-boxplot-outlier"
              key={`${value}-${index}`}
              cx={x(value)}
              cy={centerY + jitter}
              r="2.5"
            >
              <title>{`Outlier value: ${formatAxisValue(value)}`}</title>
            </circle>
          );
        })}
        <line className="eda-chart-axis" x1={left} x2={width - right} y1={axisY} y2={axisY} />
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <text
            className="eda-chart-tick"
            key={fraction}
            x={left + fraction * plotWidth}
            y={axisY + 19}
            textAnchor={fraction === 0 ? 'start' : fraction === 1 ? 'end' : 'middle'}
          >
            {formatAxisValue(minimum + fraction * range)}
          </text>
        ))}
        <text className="eda-chart-axis-label" x={left + plotWidth / 2} y={height - 5} textAnchor="middle">
          {label}
        </text>
      </svg>
      <dl className="eda-boxplot-stats">
        <div><dt>Min</dt><dd>{formatAxisValue(stats.min)}</dd></div>
        <div><dt>Q1</dt><dd>{formatAxisValue(stats.q1)}</dd></div>
        <div><dt>Median</dt><dd>{formatAxisValue(stats.median)}</dd></div>
        <div><dt>Q3</dt><dd>{formatAxisValue(stats.q3)}</dd></div>
        <div><dt>Max</dt><dd>{formatAxisValue(stats.max)}</dd></div>
      </dl>
      <p className="eda-boxplot-note">
        {formatCount(stats.outlierCount)} values outside the 1.5×IQR whiskers
        {stats.outlierCount > (stats.outlierSample || []).length
          ? ` · displaying ${formatCount((stats.outlierSample || []).length)} sampled points`
          : ''}
      </p>
    </>
  );
}

function EDAPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState('readmitted');
  const [selectedNumericFeature, setSelectedNumericFeature] = useState('time_in_hospital');

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
  const numericFeature = useMemo(
    () => summary?.numericDistributions?.find(({ key }) => key === selectedNumericFeature),
    [summary, selectedNumericFeature]
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

          <section className="eda-panel eda-numeric-panel">
            <div className="eda-panel-heading eda-feature-heading">
              <div>
                <h2>Numerical feature analysis</h2>
                <p>Explore the numeric feature distributions and spot potential outliers.</p>
              </div>
              <label className="eda-feature-select">
                <span>Select numerical feature</span>
                <select value={selectedNumericFeature} onChange={(event) => setSelectedNumericFeature(event.target.value)}>
                  {(summary.numericDistributions || []).map(({ key, label }) => <option value={key} key={key}>{label}</option>)}
                </select>
              </label>
            </div>
            {numericFeature && (
              <div className="eda-numeric-chart-grid">
                <article className="eda-chart-card">
                  <div className="eda-chart-heading">
                    <h3>Histogram</h3>
                    <p>Value frequency across encounters</p>
                  </div>
                  <NumericHistogram distribution={numericFeature} />
                </article>
                <article className="eda-chart-card">
                  <div className="eda-chart-heading">
                    <h3>Box plot</h3>
                    <p>Spread, median, quartiles, and outliers</p>
                  </div>
                  <NumericBoxPlot distribution={numericFeature} />
                </article>
              </div>
            )}
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
