'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { repository } from '@/lib/repository';
import { useDashboardStore } from '@/lib/store';
import { Site, EcosystemFilter } from '@/types';
import {
  formatStockWithCI,
  formatStock,
  formatBDT,
  formatDate,
  formatDateTime,
  formatShortHash,
} from '@/lib/utils/formatters';
import { generateSitesCSV, downloadFile } from '@/lib/utils/export';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, EcosystemBadge } from '@/components/ui/Badge';
import { Tooltip, GLOSSARY } from '@/components/ui/Tooltip';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Sprout,
  Waves,
  MapPin,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

function ReportsContent() {
  const searchParams = useSearchParams();
  const initialSiteId = searchParams.get('siteId');

  const { ecosystemFilter, setEcosystemFilter } = useDashboardStore();
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '1y'>('90d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSites() {
      setLoading(true);
      const data = await repository.getSites();
      setAllSites(data);
      if (initialSiteId) {
        setSelectedSiteIds([initialSiteId]);
      } else {
        setSelectedSiteIds(data.map((s) => s.id));
      }
      setLoading(false);
    }
    fetchSites();
  }, [initialSiteId]);

  // Filter selected sites
  const reportSites = useMemo(() => {
    return allSites.filter((s) => {
      if (ecosystemFilter !== 'all' && s.ecosystem !== ecosystemFilter) return false;
      return selectedSiteIds.includes(s.id);
    });
  }, [allSites, ecosystemFilter, selectedSiteIds]);

  // Aggregate stats
  const aggregateMetrics = useMemo(() => {
    const count = reportSites.length || 1;
    const totalArea = reportSites.reduce((acc, s) => acc + s.areaHa, 0);
    const sumStock = reportSites.reduce((acc, s) => acc + s.estimatedStock, 0);
    const sumCI = reportSites.reduce((acc, s) => acc + s.uncertaintyCI95, 0);
    const totalCarbonTons = reportSites.reduce((acc, s) => acc + s.estimatedStock * s.areaHa, 0);
    const totalCITons = reportSites.reduce((acc, s) => acc + s.uncertaintyCI95 * s.areaHa, 0);

    const agriSites = reportSites.filter((s) => s.ecosystem === 'agriculture');
    const blueSites = reportSites.filter((s) => s.ecosystem === 'blue_carbon');

    const meanStock = Number((sumStock / count).toFixed(1));
    const meanCI = Number((sumCI / count).toFixed(1));

    return {
      siteCount: reportSites.length,
      totalArea,
      meanStock,
      meanCI,
      totalCarbonTons: Math.round(totalCarbonTons),
      totalCITons: Math.round(totalCITons),
      agriCount: agriSites.length,
      agriArea: agriSites.reduce((acc, s) => acc + s.areaHa, 0),
      agriMeanStock: agriSites.length
        ? Number((agriSites.reduce((a, s) => a + s.estimatedStock, 0) / agriSites.length).toFixed(1))
        : 0,
      blueCount: blueSites.length,
      blueArea: blueSites.reduce((acc, s) => acc + s.areaHa, 0),
      blueMeanStock: blueSites.length
        ? Number((blueSites.reduce((a, s) => a + s.estimatedStock, 0) / blueSites.length).toFixed(1))
        : 0,
      flaggedCount: reportSites.filter((s) => s.qualityFlagsCount > 0).length,
      avgCompleteness: Number(
        (reportSites.reduce((acc, s) => acc + s.dataCompleteness, 0) / count).toFixed(1)
      ),
    };
  }, [reportSites]);

  // Export CSV Action
  const handleExportCSV = () => {
    const csv = generateSitesCSV(reportSites);
    downloadFile(
      csv,
      `CarbonMRV_Bangladesh_Report_${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  // Export JSON Action
  const handleExportJSON = () => {
    const payload = {
      reportTitle: 'CarbonMRV Bangladesh - Synthesis dMRV Report',
      generationTimestamp: new Date().toISOString(),
      honestyNotice: 'SYNTHETIC DEMO DATA - NOT FIELD-VERIFIED. Do not use for carbon credit trading or commercial claims.',
      aggregateMetrics,
      sites: reportSites.map((s) => ({
        id: s.id,
        name: s.name,
        ecosystem: s.ecosystem,
        district: s.district,
        division: s.division,
        coordinates: s.coordinates,
        areaHa: s.areaHa,
        estimatedCarbonStock_tCha: s.estimatedStock,
        uncertaintyCI95_tCha: s.uncertaintyCI95,
        mrvRecordId: s.mrvRecordId,
        activeModel: s.activeModel,
        dataCompletenessPercent: s.dataCompleteness,
      })),
    };
    downloadFile(
      JSON.stringify(payload, null, 2),
      `CarbonMRV_Bangladesh_Report_${new Date().toISOString().split('T')[0]}.json`,
      'application/json'
    );
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  const handleSelectAll = () => {
    const relevant = ecosystemFilter === 'all' ? allSites : allSites.filter((s) => s.ecosystem === ecosystemFilter);
    setSelectedSiteIds(relevant.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedSiteIds([]);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded" />
        <div className="h-28 bg-slate-200 rounded-xl" />
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions - Hidden in Print */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Reports & Audit Dossier Generator
            </h1>
            <Badge variant="outline" size="sm" className="font-mono text-emerald-800 bg-emerald-50">
              dMRV Synthesis
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl">
            Configure reporting scope, preview audit summaries with propagated confidence bounds, and export verification dossiers in CSV, JSON, or print-ready PDF formats.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition-colors"
          >
            <FileCode className="w-4 h-4 text-blue-700" />
            Export JSON
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Report Configuration Controls - Hidden in Print */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-subtle text-xs">
        {/* Ecosystem Filter */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
            Target Ecosystem
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['all', 'agriculture', 'blue_carbon'] as const).map((eco) => (
              <button
                key={eco}
                onClick={() => setEcosystemFilter(eco)}
                className={cn(
                  'py-1.5 px-2 rounded-lg font-medium transition-colors border text-center',
                  ecosystemFilter === eco
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                )}
              >
                {eco === 'all' ? 'All' : eco === 'agriculture' ? 'Agri' : 'Blue'}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
            Reporting Horizon
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(
              [
                { id: '30d', label: 'Last 30 Days' },
                { id: '90d', label: 'Last 90 Days' },
                { id: '1y', label: '1-Year Baseline' },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                onClick={() => setDateRange(r.id)}
                className={cn(
                  'py-1.5 px-2 rounded-lg font-medium transition-colors border text-center',
                  dateRange === r.id
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sites Selection Count */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              Sites Included ({reportSites.length})
            </label>
            <div className="space-x-2 text-[11px]">
              <button
                onClick={handleSelectAll}
                className="text-emerald-700 hover:underline font-semibold"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={handleDeselectAll}
                className="text-slate-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 font-mono text-[11px] truncate">
            {reportSites.length} of {allSites.length} monitoring stations selected
          </div>
        </div>
      </div>

      {/* Printable Report Canvas Document */}
      <div className="p-8 sm:p-12 bg-white rounded-2xl border border-slate-200 shadow-card space-y-8 card-print">
        {/* Report Official Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-800 uppercase">
              Digital Measurement, Reporting & Verification (dMRV)
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Carbon Stock Estimation & Audit Summary Report
            </h2>
            <p className="text-xs text-slate-500">
              Research Framework: Unified IoT–Machine Learning for Ecosystem-Specific Carbon Stocks in Bangladesh
            </p>
          </div>

          <div className="text-right space-y-1 font-mono text-xs flex-shrink-0">
            <div className="text-slate-500">
              Report Ref: <strong className="text-slate-900">RPT-BD-2024-MRV-882</strong>
            </div>
            <div className="text-slate-500">
              Date: <strong className="text-slate-900">{formatDate(new Date().toISOString())}</strong>
            </div>
            <div className="text-slate-500">
              Horizon: <strong className="text-slate-900">{dateRange.toUpperCase()} Continuous</strong>
            </div>
          </div>
        </div>

        {/* Prominent Demo Watermark Notice */}
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-950">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-amber-900 font-bold uppercase tracking-wider text-[11px]">
              Honesty Protocol & Legal Disclosures:
            </strong>
            <p className="leading-relaxed">
              All metrics contained in this report represent <strong>synthetic demo research data</strong> generated for framework demonstration. Numbers are strictly <strong>estimated carbon stock</strong> (t C/ha) and do not constitute verified carbon credits or carbon removal tokens. DA-UQ performance remains under active field trial validation.
            </p>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-200 pb-1">
            1. Executive Synthesis & Propagated Carbon Pool
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-xs">Included Sites</span>
              <span className="font-mono text-2xl font-bold text-slate-900">
                {aggregateMetrics.siteCount}
              </span>
              <span className="text-[11px] text-slate-400 block">Monitored parcels</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-xs">Total Monitored Area</span>
              <span className="font-mono text-2xl font-bold text-slate-900">
                {aggregateMetrics.totalArea.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 block">hectares (ha)</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-emerald-900 block text-xs font-medium">Mean Estimated Stock</span>
              <span className="font-mono text-2xl font-bold text-emerald-950">
                {aggregateMetrics.meanStock}
              </span>
              <span className="text-[11px] font-mono text-emerald-800 font-semibold block">
                ± {aggregateMetrics.meanCI} t C/ha (95% CI)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200">
              <span className="text-teal-900 block text-xs font-medium">Total Carbon Stock Pool</span>
              <span className="font-mono text-2xl font-bold text-teal-950">
                {aggregateMetrics.totalCarbonTons.toLocaleString()}
              </span>
              <span className="text-[11px] font-mono text-teal-800 font-semibold block">
                ± {aggregateMetrics.totalCITons.toLocaleString()} t C (Total)
              </span>
            </div>
          </div>
        </div>

        {/* Ecosystem Stratification Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-200 pb-1">
            2. Ecosystem Stratification & Dynamics
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Ecosystem Domain</th>
                  <th className="py-2.5 px-3">Sites</th>
                  <th className="py-2.5 px-3">Monitored Area</th>
                  <th className="py-2.5 px-3">Mean Estimated Stock</th>
                  <th className="py-2.5 px-3">Primary Soil / Sediment Slices</th>
                  <th className="py-2.5 px-3">Analytical Lab Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2.5 px-3 font-sans font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    Agriculture (Soil Organic Carbon)
                  </td>
                  <td className="py-2.5 px-3 text-slate-800">{aggregateMetrics.agriCount} sites</td>
                  <td className="py-2.5 px-3 text-slate-800">{aggregateMetrics.agriArea.toLocaleString()} ha</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-800">{aggregateMetrics.agriMeanStock} ± 4.5 t C/ha</td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">0-15 cm, 15-30 cm, 30-60 cm</td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">Dry Combustion CHN (BARC Dhaka)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-bold text-teal-900 flex items-center gap-1.5">
                    <Waves className="w-4 h-4 text-teal-600" />
                    Blue Carbon (Coastal Mangroves)
                  </td>
                  <td className="py-2.5 px-3 text-slate-800">{aggregateMetrics.blueCount} sites</td>
                  <td className="py-2.5 px-3 text-slate-800">{aggregateMetrics.blueArea.toLocaleString()} ha</td>
                  <td className="py-2.5 px-3 font-bold text-teal-800">{aggregateMetrics.blueMeanStock} ± 22.4 t C/ha</td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">0-15 cm, 15-30 cm, 30-50 cm, 50-100 cm</td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">Dry Combustion CHN (Khulna Univ.)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Quality & Integrity Assurance */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-200 pb-1">
            3. Data Quality Assurance & Anomaly Screening
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">IoT Telemetry Packet Completeness</span>
              <span className="font-mono text-base font-bold text-emerald-800">
                {aggregateMetrics.avgCompleteness}%
              </span>
              <span className="text-[10px] text-slate-400 block">Across LoRaWAN mesh</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Sites with Active QC Flags</span>
              <span className="font-mono text-base font-bold text-amber-700">
                {aggregateMetrics.flaggedCount} sites
              </span>
              <span className="text-[10px] text-slate-400 block">Flagged for drift / maintenance</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Estimation Engine</span>
              <span className="font-mono text-base font-bold text-slate-900">
                DA-UQ-v0.4b
              </span>
              <span className="text-[10px] text-slate-400 block">Conformalized Heteroscedastic</span>
            </div>
          </div>
        </div>

        {/* Detailed Site Breakdown Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-200 pb-1">
            4. Site-Specific Carbon Inventory & Cryptographic Hashes
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Site ID</th>
                  <th className="py-2.5 px-3">Site Name & District</th>
                  <th className="py-2.5 px-3">Ecosystem</th>
                  <th className="py-2.5 px-3">Area (ha)</th>
                  <th className="py-2.5 px-3">Estimated Carbon Stock</th>
                  <th className="py-2.5 px-3">Uptime</th>
                  <th className="py-2.5 px-3">MRV Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {reportSites.slice(0, 15).map((site) => (
                  <tr key={site.id}>
                    <td className="py-2 px-3 font-bold text-slate-800">{site.id}</td>
                    <td className="py-2 px-3 font-sans text-slate-800">
                      <strong>{site.name}</strong>, {site.district}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <EcosystemBadge ecosystem={site.ecosystem} />
                    </td>
                    <td className="py-2 px-3 text-slate-700">{site.areaHa}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {formatStockWithCI(site.estimatedStock, site.uncertaintyCI95)}
                    </td>
                    <td className="py-2 px-3 text-slate-700">{site.dataCompleteness}%</td>
                    <td className="py-2 px-3 text-slate-500">{site.mrvRecordId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reportSites.length > 15 && (
            <p className="text-[11px] text-slate-500 italic text-right">
              Showing top 15 of {reportSites.length} selected sites. Full inventory available in exported CSV.
            </p>
          )}
        </div>

        {/* Cryptographic Ledger Sign-off & Audit Seal */}
        <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-mono text-slate-600">
          <div className="space-y-1">
            <span className="font-sans font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
              Cryptographic Batch Merkle Root
            </span>
            <p className="font-mono text-[10px] text-slate-500 break-all bg-slate-50 p-2 rounded border border-slate-200">
              SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
            </p>
            <span className="text-[10px] text-slate-400 block font-sans">
              Linked to 40 Immutable Ingestion Hashes
            </span>
          </div>

          <div className="flex flex-col justify-end sm:items-end space-y-2">
            <div className="w-56 border-b border-slate-400 pb-1 text-center font-sans font-semibold text-slate-800">
              Dr. S. K. Rahman
            </div>
            <div className="text-[11px] text-slate-500 sm:text-right font-sans">
              Principal Investigator & dMRV Systems Lead<br />
              Bangladesh Agro-Ecological Digital MRV Initiative
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 font-mono">
          Loading Reports & Audit Generator...
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
