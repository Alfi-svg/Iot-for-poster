'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
} from 'recharts';

interface TrendDataPoint {
  month: string;
  meanStock: number;
  ciLower: number;
  ciUpper: number;
  sampleCount: number;
}

interface TrendBandChartProps {
  data: TrendDataPoint[];
  ecosystemLabel?: string;
  height?: number;
}

export function TrendBandChart({
  data,
  ecosystemLabel = 'All Monitored Ecosystems',
  height = 280,
}: TrendBandChartProps) {
  // Format for Recharts area band: base + range
  const chartData = data.map((d) => ({
    ...d,
    ciBand: [d.ciLower, d.ciUpper],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs space-y-1">
          <p className="font-semibold text-slate-200">{label}</p>
          <p className="text-emerald-400 font-mono text-sm font-bold">
            Mean: {p.meanStock} t C/ha
          </p>
          <div className="pt-1 border-t border-slate-800 text-slate-300 space-y-0.5">
            <p>95% CI Band: [{p.ciLower} – {p.ciUpper}] t C/ha</p>
            <p className="text-slate-400 text-[11px]">Interval Width: ±{(p.meanStock - p.ciLower).toFixed(1)} t C/ha</p>
            <p className="text-slate-400 text-[11px]">Aggregated Telemetry Points: {p.sampleCount}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="uncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#0F766E" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
            unit=" t"
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
          />
          {/* Shaded 95% Confidence Band */}
          <Area
            type="monotone"
            dataKey="ciUpper"
            stroke="none"
            fill="url(#uncertaintyGradient)"
            name="95% Confidence Ribbon (± CI)"
          />
          <Area
            type="monotone"
            dataKey="ciLower"
            stroke="none"
            fill="#ffffff"
            name="CI Lower Bound"
            legendType="none"
          />
          {/* Estimated Mean Carbon Stock Line */}
          <Line
            type="monotone"
            dataKey="meanStock"
            stroke="#15803D"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#15803D', strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 6, fill: '#047857' }}
            name="Mean Estimated Stock (t C/ha)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
