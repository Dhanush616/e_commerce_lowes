import { useId } from "react";

function compact(value) {
  const number = Number(value) || 0;
  if (number >= 100000) return `₹${(number / 100000).toFixed(1)}L`;
  if (number >= 1000) return `₹${Math.round(number / 1000)}k`;
  return `₹${number}`;
}

/** Hand-built SVG bar chart — no chart library. */
export function BarChart({ data = [], height = 240, formatValue = compact }) {
  const width = 560;
  const pad = { top: 22, right: 16, bottom: 40, left: 52 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((item) => item.value));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const slot = data.length ? plotW / data.length : plotW;
  const barWidth = Math.min(66, slot * 0.56);

  return (
    <svg className="fs-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bar chart">
      {ticks.map((tick) => {
        const y = pad.top + plotH - tick * plotH;
        return (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              className="fs-chart-grid"
            />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fs-chart-tick">
              {formatValue(max * tick)}
            </text>
          </g>
        );
      })}

      {data.map((item, index) => {
        const barHeight = max ? (item.value / max) * plotH : 0;
        const x = pad.left + index * slot + (slot - barWidth) / 2;
        const y = pad.top + plotH - barHeight;
        return (
          <g key={item.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx={0}
              className="fs-chart-bar"
            />
            <text
              x={x + barWidth / 2}
              y={y - 7}
              textAnchor="middle"
              className="fs-chart-value"
            >
              {formatValue(item.value)}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - 16}
              textAnchor="middle"
              className="fs-chart-label"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Hand-built SVG line/area chart for the last seven days. */
export function LineChart({ data = [], height = 240, formatValue = (value) => value }) {
  const gradientId = `fs-line-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const width = 560;
  const pad = { top: 22, right: 20, bottom: 40, left: 42 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((item) => item.value));
  const step = data.length > 1 ? plotW / (data.length - 1) : plotW;

  const points = data.map((item, index) => ({
    x: pad.left + index * step,
    y: pad.top + plotH - (item.value / max) * plotH,
    ...item,
  }));

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length
    ? `${pad.left},${pad.top + plotH} ${line} ${points[points.length - 1].x},${pad.top + plotH}`
    : "";

  return (
    <svg className="fs-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Line chart">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0a0a" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((tick) => {
        const y = pad.top + plotH - tick * plotH;
        return (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="fs-chart-grid" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fs-chart-tick">
              {formatValue(max * tick)}
            </text>
          </g>
        );
      })}

      {area && <polygon points={area} fill={`url(#${gradientId})`} />}
      {points.length > 1 && <polyline points={line} className="fs-chart-line" />}

      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="4.5" className="fs-chart-dot" />
          <text x={point.x} y={height - 16} textAnchor="middle" className="fs-chart-label">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
