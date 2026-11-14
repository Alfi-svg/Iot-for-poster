'use client';

import React from 'react';
import Link from 'next/link';
import { Site } from '@/types';
import {
  formatStockWithCI,
  formatPercent,
  formatDate,
  formatDateTime,
} from '@/lib/utils/formatters';
import { Badge, EcosystemBadge } from '@/components/ui/Badge';
import { Tooltip, GLOSSARY } from '@/components/ui/Tooltip';
import { SensorTimeSeriesChart } from '@/components/charts/SensorTimeSeriesChart';
import {
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Activity,
  ArrowRight,
  FlaskConical,
} from 'lucide-react';

interface SiteDetailDrawerProps {
  site: Site | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SiteDetailDrawer({ site, isOpen, onClose }: SiteDetailDrawerProps) {
  if (!isOpen || !site) return null;

  const isAgri = site.ecosystem === 'agriculture';

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {site.id}
            </span>
            <EcosystemBadge ecosystem={site.ecosystem} />
          </div>
          <h2 className="text-base font-bold text-slate-900 leading-snug">{site.name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {site.upazila}, {site.district}, {site.division} • {site.coordinates.lat.toFixed(4)}°N,{' '}
            {site.coordinates.lng.toFixed(4)}°E
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          aria-label="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
        {/* Estimated Carbon Stock Callout */}
        <div
          className={`p-4 rounded-xl border ${
            isAgri
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-teal-50/70 border-teal-200'
          } space-y-2`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">Estimated Carbon Stock</span>
            <Tooltip content={GLOSSARY.ESTIMATED_STOCK} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {site.estimatedStock.toFixed(1)}
            </span>
            <span
              className={`text-sm font-mono font-bold ${
                isAgri ? 'text-emerald-800' : 'text-teal-800'
              }`}
            >
              ± {site.uncertaintyCI95.toFixed(1)} t C/ha
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600 font-mono">
            <span>Interval Width: {site.uncertaintyPercent}%</span>
            <span>95% CI: [{(site.estimatedStock - site.uncertaintyCI95).toFixed(1)} – {(site.estimatedStock + site.uncertaintyCI95).toFixed(1)}]</span>
          </div>
        </div>

        {/* Quality Flags Notice if any */}
        {site.qualityFlagsCount > 0 ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{site.qualityFlagsCount} Active Quality Flag(s)</span>
            </div>
            {site.qualityFlags.map((flag) => (
              <p key={flag.id} className="text-xs text-amber-800">
                • <strong className="uppercase font-mono text-[11px]">{flag.type.replace('_', ' ')}:</strong> {flag.message}
              </p>
            ))}
          </div>
        ) : (
          <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-xs text-green-900">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Zero sensor anomalies detected. Telemetry passes all 14 automated QC rules.</span>
          </div>
        )}

        {/* Data Completeness Meter */}
        <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-500" />
              IoT Sensor Data Completeness (90-day)
            </span>
            <span className="font-mono font-bold text-slate-900">{site.dataCompleteness}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                site.dataCompleteness > 95
                  ? 'bg-emerald-600'
                  : site.dataCompleteness > 90
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${site.dataCompleteness}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{site.sensorNodeCount} Active Nodes</span>
            <span>Last Packet: {formatDateTime(site.lastTelemetryAt)}</span>
          </div>
        </div>

        {/* IoT Telemetry Sparkline / Multi-stream */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              {isAgri ? 'Soil IoT Multi-Sensor Telemetry' : 'Coastal Hydrological Telemetry'}
            </h4>
            <span className="text-[11px] font-mono text-slate-400">90-Day Continuous</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <SensorTimeSeriesChart
              telemetry={site.recentTelemetry}
              ecosystem={site.ecosystem}
              height={200}
            />
          </div>
        </div>

        {/* Soil Core Lab Ground Truth Measurement */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                Lab Soil/Sediment Core History
              </h4>
              <Tooltip content="Physical ground-truth soil cores extracted and tested via dry combustion CHN elemental analysis for depth calibration." />
            </div>
            <span className="text-[11px] text-slate-500">{site.soilCoreHistory.length} Depth Layers</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Depth</th>
                  <th className="py-2 px-3">SOC %</th>
                  <th className="py-2 px-3">Bulk Density</th>
                  <th className="py-2 px-3">Layer Carbon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {site.soilCoreHistory.map((core) => (
                  <tr key={core.id} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-800">{core.depthInterval}</td>
                    <td className="py-1.5 px-3 text-slate-700">{core.socPercent}%</td>
                    <td className="py-1.5 px-3 text-slate-700">{core.bulkDensity} g/cm³</td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">{core.carbonDensity} t C/ha</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            Calibrated at: {site.soilCoreHistory[0]?.labName || 'BARC Soil Chemistry Division'}
          </p>
        </div>

        {/* Adaptive Sampling Recommendation */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-emerald-700" />
              Adaptive Lab Sampling Status
            </span>
            <Badge
              variant={
                site.samplingPriority === 'urgent'
                  ? 'critical'
                  : site.samplingPriority === 'recommended'
                  ? 'warning'
                  : 'neutral'
              }
              size="sm"
            >
              {site.samplingPriority.toUpperCase()} PRIORITY
            </Badge>
          </div>
          <p className="text-xs text-slate-600">
            Predicted uncertainty reduction from next soil core dispatch: <strong className="text-emerald-800 font-mono">{site.expectedUncertaintyReduction}%</strong>. Estimated cost: <strong className="font-mono">৳{site.estimatedSamplingCostBDT.toLocaleString()}</strong>.
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
        <Link
          href={`/sites/${site.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Full Site Analytics
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href={`/ledger?siteId=${site.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-800 text-xs font-semibold text-white hover:bg-emerald-900 transition-colors shadow-sm"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          MRV Audit Record
        </Link>
      </div>
    </div>
  );
}
