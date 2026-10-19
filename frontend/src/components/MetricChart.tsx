import React, { useState } from 'react';

interface MetricPoint {
  timestamp: string;
  value: number;
}

interface MetricChartProps {
  title: string;
  unit: string;
  data: MetricPoint[];
  color?: 'cyan' | 'purple' | 'emerald' | 'amber';
  height?: number;
}

export const MetricChart: React.FC<MetricChartProps> = ({
  title,
  unit,
  data,
  color = 'cyan',
  height = 160
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-slate-500 text-xs font-mono h-48">
        No metric history data available for this timeframe
      </div>
    );
  }

  const values = data.map(d => d.value);
  const minVal = Math.floor(Math.min(...values));
  const maxVal = Math.ceil(Math.max(...values, 10)); // Ensure non-zero ceiling
  const range = maxVal - minVal || 1;

  const width = 600;
  const paddingX = 10;
  const paddingTop = 20;
  const paddingBottom = 25;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1 || 1)) * (width - 2 * paddingX);
    const y = paddingTop + chartHeight - ((d.value - minVal) / range) * chartHeight;
    return { x, y, value: d.value, timestamp: d.timestamp };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  const colorConfig = {
    cyan: { stroke: '#06b6d4', fill: 'url(#gradient-cyan)', text: 'text-cyan-400' },
    purple: { stroke: '#a855f7', fill: 'url(#gradient-purple)', text: 'text-purple-400' },
    emerald: { stroke: '#10b981', fill: 'url(#gradient-emerald)', text: 'text-emerald-400' },
    amber: { stroke: '#f59e0b', fill: 'url(#gradient-amber)', text: 'text-amber-400' },
  }[color];

  const latestVal = values[values.length - 1];
  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className={`text-xl font-bold font-mono ${colorConfig.text}`}>
              {activePoint ? activePoint.value.toFixed(1) : latestVal.toFixed(1)}
              <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {activePoint && new Date(activePoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="text-right text-[11px] text-slate-500 font-mono">
          <div>Max: {maxVal.toFixed(0)}{unit}</div>
          <div>Min: {minVal.toFixed(0)}{unit}</div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="gradient-cyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-purple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-emerald" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-amber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          <line x1={paddingX} y1={paddingTop} x2={width - paddingX} y2={paddingTop} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
          <line x1={paddingX} y1={paddingTop + chartHeight / 2} x2={width - paddingX} y2={paddingTop + chartHeight / 2} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
          <line x1={paddingX} y1={paddingTop + chartHeight} x2={width - paddingX} y2={paddingTop + chartHeight} stroke="#334155" strokeOpacity="0.6" />

          {/* Area & Line */}
          <path d={areaD} fill={colorConfig.fill} />
          <path d={pathD} fill="none" stroke={colorConfig.stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Hover tracker line & point */}
          {hoverIndex !== null && (
            <>
              <line
                x1={points[hoverIndex].x}
                y1={paddingTop}
                x2={points[hoverIndex].x}
                y2={paddingTop + chartHeight}
                stroke="#94a3b8"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <circle
                cx={points[hoverIndex].x}
                cy={points[hoverIndex].y}
                r="4.5"
                fill={colorConfig.stroke}
                stroke="#0f172a"
                strokeWidth="2"
              />
            </>
          )}

          {/* Touch/Mouse Hit Detection Areas */}
          {points.map((p, idx) => (
            <rect
              key={idx}
              x={p.x - 10}
              y={0}
              width={20}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(idx)}
              onTouchStart={() => setHoverIndex(idx)}
              className="cursor-crosshair"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};
