'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { repository } from '@/lib/repository';
import { Site } from '@/types';
import {
  formatStockWithCI,
  formatPercent,
  formatDate,
  formatDateTime,
  formatBDT,
} from '@/lib/utils/formatters';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, EcosystemBadge } from '@/components/ui/Badge';
import { Tooltip, GLOSSARY } from '@/components/ui/Tooltip';
import { SensorTimeSeriesChart } from '@/components/charts/SensorTimeSeriesChart';
import { TrendBandChart } from '@/components/charts/TrendBandChart';
import {
  ArrowLeft,
  ShieldCheck,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  MapPin,
  Calendar,
  Cpu,
  FileText,
  Share2,
} from 'lucide-react';

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSite() {
      if (!siteId) return;
      setLoading(true);
      const data = await repository.getSiteById(siteId);
      setSite(data);
      setLoading(false);
    }
    loadSite();
  }, [siteId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-40 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl" />
          <div className="h-96 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Site Not Found</h2>
        <p className="text-sm text-slate-500">The site ID &quot;{siteId}&quot; does not exist in the database.</p>
        <Link
          href="/map"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-lg text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Spatial Map
        </Link>
      </div>
    );
  }

  const isAgri = site.ecosystem === 'agriculture';

  // Format trend data for this specific site
  const siteTrend = site.recentTelemetry.filter((_, i) => i % 15 === 0).map((t) => ({
    month: t.timestamp,
    meanStock: t.estimatedStock,
    ciLower: t.ciLower,
    ciUpper: t.ciUpper,
    sampleCount: 24,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/map"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Map Explorer
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/ledger?siteId=${site.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 shadow-sm transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            View Auditable Ledger Record
          </Link>
          <Link
            href={`/reports?siteId=${site.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Generate Site Report
          </Link>
        </div>
      </div>

      {/* Hero Site Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {site.id}
              </span>
              <EcosystemBadge ecosystem={site.ecosystem} />
              <Badge variant="outline" size="sm" className="font-mono text-slate-600">
                {site.activeModel}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{site.name}</h1>
            <p className="text-sm text-slate-600 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {site.upazila}, {site.district}, {site.division} Division
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-xs text-slate-500">
                {site.coordinates.lat.toFixed(4)}°N, {site.coordinates.lng.toFixed(4)}°E
              </span>
              <span className="text-slate-300">•</span>
              <span>Area: {site.areaHa} ha</span>
              <span className="text-slate-300">•</span>
              <span className="italic text-slate-500">{site.landType}</span>
            </p>
          </div>

          {/* Primary Carbon Stock Value */}
          <div
            className={`p-4 rounded-xl border flex-shrink-0 min-w-[260px] ${
              isAgri
                ? 'bg-emerald-50/80 border-emerald-300/80'
                : 'bg-teal-50/80 border-teal-300/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span className="font-semibold uppercase tracking-wider">Estimated Carbon Stock</span>
              <Tooltip content={GLOSSARY.ESTIMATED_STOCK} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900">
                {site.estimatedStock.toFixed(1)}
              </span>
              <span
                className={`text-base font-mono font-bold ${
                  isAgri ? 'text-emerald-800' : 'text-teal-800'
                }`}
              >
                ± {site.uncertaintyCI95.toFixed(1)} t C/ha
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>95% CI Range:</span>
              <span>[{(site.estimatedStock - site.uncertaintyCI95).toFixed(1)} – {(site.estimatedStock + site.uncertaintyCI95).toFixed(1)}]</span>
            </div>
          </div>
        </div>

        {/* Quality Flags Notice Banner */}
        {site.qualityFlagsCount > 0 ? (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">
                {site.qualityFlagsCount} Data Quality Alert(s) Detected on this Site:
              </span>
              {site.qualityFlags.map((flag) => (
                <div key={flag.id}>
                  • <strong className="uppercase font-mono">{flag.type.replace('_', ' ')}:</strong> {flag.message} ({formatDateTime(flag.timestamp)})
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-xs text-green-900">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Telemetry validated: Clean signal across all sensor channels with zero quality drift flags.</span>
          </div>
        )}
      </div>

      {/* Main Grid: Telemetry & Lab Ground Truth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Multi-Sensor Telemetry Time Series */}
        <div className="lg:col-span-2 space-y-6">
          {/* IoT Sensor Streams */}
          <Card variant="default">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-700" />
                  <span>Continuous IoT Telemetry Multi-Stream</span>
                </div>
              }
              subtitle="90-day time series from in-situ soil probes & hydrological loggers"
              action={
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">
                    {site.sensorNodeCount} Sensor Nodes
                  </span>
                  <Badge variant="outline" size="sm">
                    {site.dataCompleteness}% Uptime
                  </Badge>
                </div>
              }
            />
            <SensorTimeSeriesChart
              telemetry={site.recentTelemetry}
              ecosystem={site.ecosystem}
              height={260}
            />
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Last Telemetry</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatDateTime(site.lastTelemetryAt)}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Packet Completeness</span>
                <span className="font-mono font-semibold text-emerald-800">
                  {site.dataCompleteness}%
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Active Nodes</span>
                <span className="font-mono font-semibold text-slate-800">
                  {site.sensorNodeCount} Nodes (LoRaWAN)
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Inference Frequency</span>
                <span className="font-mono font-semibold text-slate-800">Daily Batch Run</span>
              </div>
            </div>
          </Card>

          {/* Site-Level Trajectory with 95% Confidence Band */}
          <Card variant="default">
            <CardHeader
              title="Estimated Stock Trajectory & 95% Uncertainty Ribbon"
              subtitle="Daily estimated carbon stock evolution with model confidence bounds"
            />
            <TrendBandChart data={siteTrend} height={220} />
          </Card>
        </div>

        {/* Right Column (1 span): Soil Core Lab Data & Adaptive Sampling */}
        <div className="space-y-6">
          {/* Soil Core Lab Ground Truth Measurement */}
          <Card variant="default">
            <CardHeader
              title="Lab Soil Core Measurements"
              subtitle="Physical depth slices analyzed by dry combustion CHN"
              action={
                <Tooltip content="Physical ground-truth measurements anchor model calibration and calculate depth-stratified carbon stock." />
              }
            />
            <div className="space-y-3">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Depth</th>
                      <th className="py-2 px-3">SOC %</th>
                      <th className="py-2 px-3">Bulk Dens.</th>
                      <th className="py-2 px-3">Layer Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {site.soilCoreHistory.map((core) => (
                      <tr key={core.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-sans font-medium text-slate-800">
                          {core.depthInterval}
                        </td>
                        <td className="py-2 px-3 text-slate-700">{core.socPercent}%</td>
                        <td className="py-2 px-3 text-slate-700">{core.bulkDensity} g/cm³</td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {core.carbonDensity} t C/ha
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <p>
                  <strong>Testing Laboratory:</strong> {site.soilCoreHistory[0]?.labName}
                </p>
                <p>
                  <strong>Analytical Method:</strong> Dry Combustion Elemental CHN Analyzer (Elementar)
                </p>
                <p>
                  <strong>Last Sampling Date:</strong> {formatDate(site.lastLabSampleAt)}
                </p>
              </div>
            </div>
          </Card>

          {/* Adaptive Sampling Queue Card */}
          <Card variant="bluecarbon">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-teal-700" />
                  <span>Adaptive Lab Sampling Status</span>
                </div>
              }
              subtitle="Active learning recommendation based on model entropy"
            />
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-teal-200/80">
                <span className="text-slate-600">Sampling Priority:</span>
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
                  {site.samplingPriority.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-teal-200/80 font-mono">
                <span className="text-slate-600 font-sans">Current Dispatch Status:</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {site.samplingStatus === 'none' ? 'Routine Monitoring' : site.samplingStatus}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-teal-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Expected Variance Reduction:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {site.expectedUncertaintyReduction}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Estimated Sampling Cost:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatBDT(site.estimatedSamplingCostBDT)}
                  </span>
                </div>
              </div>

              <Link
                href="/sampling"
                className="w-full py-2 bg-teal-800 text-white rounded-lg font-semibold text-center block hover:bg-teal-900 transition-colors shadow-sm"
              >
                Manage in Adaptive Queue
              </Link>
            </div>
          </Card>

          {/* Link to Auditable MRV Record */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Auditable dMRV Record</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every estimate for this site is hashed with a cryptographic SHA-256 fingerprint, linking raw LoRa packets, calibration parameters, and model weights into an immutable ledger.
            </p>
            <div className="font-mono text-xs text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
              Record ID: <span className="text-emerald-300 font-bold">{site.mrvRecordId}</span>
            </div>
            <Link
              href={`/ledger?siteId=${site.id}`}
              className="inline-flex items-center justify-center w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Inspect Complete Provenance Chain
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
