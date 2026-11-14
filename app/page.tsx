'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { useDashboardStore } from '@/lib/store';
import {
  OverviewMetrics,
  ActivityFeedItem,
  Ecosystem,
} from '@/types';
import {
  formatStockWithCI,
  formatPercent,
  formatDateTime,
} from '@/lib/utils/formatters';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, EcosystemBadge } from '@/components/ui/Badge';
import { Tooltip, GLOSSARY } from '@/components/ui/Tooltip';
import { TrendBandChart } from '@/components/charts/TrendBandChart';
import {
  MapPin,
  TrendingUp,
  AlertTriangle,
  FlaskConical,
  ShieldCheck,
  ArrowRight,
  Sprout,
  Waves,
  Layers,
  CheckCircle2,
  Cpu,
  Clock,
} from 'lucide-react';

export default function OverviewPage() {
  const { ecosystemFilter } = useDashboardStore();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [trendData, setTrendData] = useState<
    Array<{
      month: string;
      meanStock: number;
      ciLower: number;
      ciUpper: number;
      sampleCount: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [m, feed, trend] = await Promise.all([
        repository.getOverviewMetrics(ecosystemFilter),
        repository.getActivityFeed(6),
        repository.getHistoricalStockTrend(ecosystemFilter),
      ]);
      setMetrics(m);
      setActivityFeed(feed);
      setTrendData(trend);
      setLoading(false);
    }
    loadData();
  }, [ecosystemFilter]);

  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200/70 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200/70 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200/70 rounded-xl" />
          <div className="h-80 bg-slate-200/70 rounded-xl" />
        </div>
      </div>
    );
  }

  const getEcosystemLabel = () => {
    if (ecosystemFilter === 'agriculture') return 'Agriculture (Soil Organic Carbon)';
    if (ecosystemFilter === 'blue_carbon') return 'Blue Carbon (Coastal Mangroves)';
    return 'Unified All-Ecosystem Overview';
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {getEcosystemLabel()}
            </h1>
            <Badge variant="outline" size="sm" className="font-mono text-emerald-800 bg-emerald-50/50">
              MRV Bangladesh
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl">
            Continuous IoT telemetry, optical satellite proxies, and domain-adaptive ML for verifiable carbon stock estimation across Bangladesh agro-ecological zones and coastal mangrove habitats.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-emerald-900 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Explore Map
          </Link>
          <Link
            href="/sampling"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <FlaskConical className="w-4 h-4 text-emerald-700" />
            Sampling Queue ({metrics.pendingLabSamples})
          </Link>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Monitored Sites */}
        <Card variant="default">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Total Monitored Sites</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {metrics.totalSites}
            </span>
            <span className="text-xs text-slate-500">sites</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <Sprout className="w-3 h-3" /> {metrics.agricultureSites} Agri
            </span>
            <span className="flex items-center gap-1 text-teal-700 font-medium">
              <Waves className="w-3 h-3" /> {metrics.blueCarbonSites} Blue
            </span>
          </div>
        </Card>

        {/* KPI 2: Mean Estimated Carbon Stock */}
        <Card variant="agri">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-slate-700">Mean Estimated Stock</span>
              <Tooltip content={GLOSSARY.ESTIMATED_STOCK} />
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-bold font-mono text-emerald-950 tracking-tight">
              {metrics.meanEstimatedStock}
            </span>
            <span className="text-xs font-mono font-medium text-emerald-800">
              ± {metrics.meanUncertaintyCI95} t C/ha
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Area: {metrics.totalMonitoredAreaHa.toLocaleString()} ha</span>
            <span className="text-[10px] text-slate-400 font-mono">95% CI</span>
          </div>
        </Card>

        {/* KPI 3: Predictive Uncertainty */}
        <Card variant="default">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-slate-600">Predictive Uncertainty</span>
              <Tooltip content={GLOSSARY.CI} />
            </div>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatPercent(metrics.meanUncertaintyPercent)}
            </span>
            <span className="text-xs font-mono text-slate-500">relative width</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Model: DA-UQ Ensemble</span>
            <span className="text-emerald-700 font-medium">Conformalized</span>
          </div>
        </Card>

        {/* KPI 4: Quality Flags & Sensor Drift */}
        <Card variant={metrics.flaggedSitesPercentage > 0 ? 'default' : 'subtle'}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Quality Flagged Records</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                metrics.flaggedSitesPercentage > 0 ? 'text-amber-500' : 'text-slate-400'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tracking-tight ${
                metrics.flaggedSitesPercentage > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {metrics.flaggedSitesPercentage}%
            </span>
            <span className="text-xs text-slate-500">of sites</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>QC Drift & Anomaly checks</span>
            <span className="text-amber-600 font-medium font-mono">
              {Math.round((metrics.flaggedSitesPercentage / 100) * metrics.totalSites)} flagged
            </span>
          </div>
        </Card>

        {/* KPI 5: Adaptive Lab Sampling Queue */}
        <Card variant="bluecarbon">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-slate-700">Adaptive Lab Queue</span>
              <Tooltip content={GLOSSARY.ADAPTIVE_SAMPLING} />
            </div>
            <FlaskConical className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-teal-950 tracking-tight">
              {metrics.pendingLabSamples}
            </span>
            <span className="text-xs text-teal-800 font-medium">pending dispatch</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <Link
              href="/sampling"
              className="text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-0.5"
            >
              Prioritize samples <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Main Grid: Trend Chart + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Aggregate Trend Chart with 95% CI Band */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="default">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <span>Estimated Carbon Stock Trajectory</span>
                  <Tooltip content="Monthly aggregate estimated stock trajectory with shaded 95% confidence interval band showing uncertainty contraction as continuous IoT and satellite telemetry assimilate." />
                </div>
              }
              subtitle="6-Month aggregate time series with empirical 95% Confidence Interval (CI) ribbon"
              action={
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm" className="font-mono">
                    DA-UQ-v0.4b
                  </Badge>
                </div>
              }
            />
            <TrendBandChart data={trendData} ecosystemLabel={getEcosystemLabel()} />
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Line: Mean Estimated Stock (t C/ha)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded bg-emerald-300/40 border border-emerald-400/50" />
                Shaded Ribbon: 95% Predictive Confidence Interval
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Unit: metric tons Carbon per hectare (t C/ha)
              </span>
            </div>
          </Card>

          {/* Ecosystem Comparative Scientific Framework */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Agriculture Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-950 text-sm">Agriculture (SOC)</h4>
                    <p className="text-[11px] text-emerald-700">Soil Organic Carbon</p>
                  </div>
                </div>
                <Badge variant="agriculture" size="sm">25 Sites</Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                Barind Tract clay & Tista floodplain soils. Measured via continuous volumetric water content, soil temperature, EC, and calibrated against CHN dry combustion cores (0-30 cm).
              </p>
              <div className="pt-2 flex items-center justify-between text-xs font-mono text-emerald-900 border-t border-emerald-200/60">
                <span>Stock Range: 28 – 58 t C/ha</span>
                <span>Uncertainty: ±3 – 6 t C/ha</span>
              </div>
            </div>

            {/* Blue Carbon Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50/70 to-teal-100/30 border border-teal-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center">
                    <Waves className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-teal-950 text-sm">Blue Carbon (Coastal)</h4>
                    <p className="text-[11px] text-teal-700">Mangrove & Estuarine Sediment</p>
                  </div>
                </div>
                <Badge variant="blue_carbon" size="sm">15 Sites</Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                Sundarbans & Cox’s Bazar intertidal mangroves. Dynamic hydrological monitoring with optical salinity loggers, tidal water levels, redox potential, and deep sediment cores (0-100 cm).
              </p>
              <div className="pt-2 flex items-center justify-between text-xs font-mono text-teal-900 border-t border-teal-200/60">
                <span>Stock Range: 140 – 295 t C/ha</span>
                <span>Uncertainty: ±14 – 32 t C/ha</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Recent Activity & Audit Feed */}
        <div className="space-y-6">
          <Card variant="default">
            <CardHeader
              title="Recent MRV Activity"
              subtitle="Auditable telemetry events & sampling queue"
              action={
                <Link
                  href="/ledger"
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold inline-flex items-center gap-1"
                >
                  Ledger <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />
            <div className="space-y-3.5">
              {activityFeed.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 hover:bg-slate-100/70 transition-colors text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {item.severity === 'warning' && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      )}
                      {item.severity === 'success' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      )}
                      {item.severity === 'info' && (
                        <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      )}
                      <span className="font-semibold text-slate-900">{item.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {formatDateTime(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-normal">{item.description}</p>

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium truncate max-w-[170px]">
                      {item.siteName}
                    </span>
                    <EcosystemBadge ecosystem={item.ecosystem} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <Link
                href="/ledger"
                className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                View full cryptographic ledger audit trail
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
