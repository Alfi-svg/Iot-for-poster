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
  ReferenceLine,
} from 'recharts';
import { formatBDT } from '@/lib/utils/formatters';

interface CostCurvePoint {
  budgetBDT: number;
  sitesSampled: number;
  aggregateUncertaintyReductionPct: number;
}

interface CostUncertaintyChartProps {
  data: CostCurvePoint[];
  currentBudget?: number;
  height?: number;
}

export function CostUncertaintyChart({
  data,
  currentBudget = 150000,
  height = 240,
}: CostUncertaintyChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs space-y-1">
          <p className="font-semibold text-slate-200">Budget: {formatBDT(p.budgetBDT)}</p>
          <p className="text-teal-400 font-mono font-bold text-sm">
            Variance Reduction: {p.aggregateUncertaintyReductionPct}%
          </p>
          <div className="pt-1 border-t border-slate-800 text-slate-400 text-[11px]">
            <p>Priority Sites Dispatched: {p.sitesSampled} sites</p>
            <p className="text-slate-500 mt-0.5">Active Learning Information Gain Frontier</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="budgetFrontierGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0F766E" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="budgetBDT"
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            tickFormatter={(val) => `৳${val / 1000}k`}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={false}
            unit="%"
            domain={[0, 70]}
          />
          <Tooltip content={<CustomTooltip />} />
          {currentBudget && (
            <ReferenceLine
              x={currentBudget}
              stroke="#D97706"
              strokeDasharray="3 3"
              label={{
                value: 'Selected Budget',
                fill: '#D97706',
                fontSize: 10,
                position: 'top',
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="aggregateUncertaintyReductionPct"
            stroke="#0F766E"
            strokeWidth={2.5}
            fill="url(#budgetFrontierGradient)"
            name="Uncertainty Reduction (%)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
