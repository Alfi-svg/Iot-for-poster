'use client';

import React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface CoveragePoint {
  predictedRank: number;
  observedValue: number;
  predMean: number;
  ciLower: number;
  ciUpper: number;
  inInterval: boolean;
}

interface CoverageChartProps {
  data: CoveragePoint[];
  height?: number;
}

export function CoverageChart({ data, height = 280 }: CoverageChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    ciBand: [d.ciLower, d.ciUpper],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs space-y-1">
          <p className="font-semibold text-slate-200">Validation Point #{p.predictedRank}</p>
          <p className="text-emerald-400 font-mono">Predicted Mean: {p.predMean} t C/ha</p>
          <p className="text-teal-300 font-mono">95% CI Band: [{p.ciLower} – {p.ciUpper}] t C/ha</p>
          <p className="text-amber-400 font-mono font-bold">Observed Lab Value: {p.observedValue} t C/ha</p>
          <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span>Interval Coverage:</span>
            <span
              className={`font-bold ${
                p.inInterval ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {p.inInterval ? '✓ Inside 95% Band' : '✗ Outside Interval'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const insideCount = data.filter((d) => d.inInterval).length;
  const picpPct = ((insideCount / data.length) * 100).toFixed(1);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Validation sample sorted by predicted carbon stock magnitude</span>
        <span className="font-mono text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Empirical PICP: {picpPct}% (Nominal 95.0%)
        </span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="coverageRibbon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0F766E" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="predictedRank"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              label={{ value: 'Rank-Ordered Sites (Low to High Carbon Stock)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              unit=" t"
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
            />
            {/* Shaded Upper Ribbon */}
            <Area
              type="monotone"
              dataKey="ciUpper"
              stroke="none"
              fill="url(#coverageRibbon)"
              name="Predicted 95% Confidence Band"
            />
            {/* White-out lower bound for ribbon effect */}
            <Area
              type="monotone"
              dataKey="ciLower"
              stroke="none"
              fill="#ffffff"
              legendType="none"
            />
            {/* Predicted Mean Line */}
            <Line
              type="monotone"
              dataKey="predMean"
              stroke="#0D9488"
              strokeWidth={2}
              dot={false}
              name="DA-UQ Predicted Mean"
            />
            {/* Observed Lab Measurements */}
            <Scatter
              dataKey="observedValue"
              fill="#D97706"
              name="Observed Lab Soil Cores"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
