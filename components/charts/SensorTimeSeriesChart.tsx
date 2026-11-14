'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TelemetryReading, Ecosystem } from '@/types';

interface SensorTimeSeriesChartProps {
  telemetry: TelemetryReading[];
  ecosystem: Ecosystem;
  height?: number;
}

export function SensorTimeSeriesChart({
  telemetry,
  ecosystem,
  height = 240,
}: SensorTimeSeriesChartProps) {
  // Show every 3rd point if 90 points for cleaner axis
  const sampledData = telemetry.filter((_, idx) => idx % 3 === 0);

  const isAgri = ecosystem === 'agriculture';

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sampledData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            tickFormatter={(str) => str.slice(5)} // MM-DD
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            domain={isAgri ? [10, 45] : [5, 35]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            domain={isAgri ? [15, 35] : [0, 3]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#fff',
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingBottom: 6 }}
          />

          {isAgri ? (
            <>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="soilMoisture"
                stroke="#0284C7"
                strokeWidth={1.5}
                dot={false}
                name="Soil Moisture (% VWC)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="soilTemp"
                stroke="#EA580C"
                strokeWidth={1.5}
                dot={false}
                name="Soil Temp (°C)"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ph"
                stroke="#16A34A"
                strokeWidth={1.5}
                dot={false}
                name="Soil pH"
              />
            </>
          ) : (
            <>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="salinity"
                stroke="#0D9488"
                strokeWidth={1.5}
                dot={false}
                name="Salinity (ppt)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="waterLevel"
                stroke="#0284C7"
                strokeWidth={1.5}
                dot={false}
                name="Tidal Level (m)"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="waterTemp"
                stroke="#EA580C"
                strokeWidth={1.5}
                dot={false}
                name="Water Temp (°C)"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
