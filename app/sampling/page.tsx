'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { useDashboardStore } from '@/lib/store';
import { Site, EcosystemFilter } from '@/types';
import {
  formatStockWithCI,
  formatBDT,
  formatPercent,
  formatDate,
} from '@/lib/utils/formatters';
import { calculateCumulativeUncertaintyReduction } from '@/lib/utils/ranking';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, EcosystemBadge } from '@/components/ui/Badge';
import { Tooltip, GLOSSARY } from '@/components/ui/Tooltip';
import { CostUncertaintyChart } from '@/components/charts/CostUncertaintyChart';
import { RequestSampleModal } from '@/components/sampling/RequestSampleModal';
import {
  FlaskConical,
  TrendingDown,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function AdaptiveSamplingPage() {
  const { ecosystemFilter, setEcosystemFilter } = useDashboardStore();
  const [queueSites, setQueueSites] = useState<Site[]>([]);
  const [costCurve, setCostCurve] = useState<
    Array<{ budgetBDT: number; sitesSampled: number; aggregateUncertaintyReductionPct: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Simulation Budget Slider state
  const [simulationBudget, setSimulationBudget] = useState(150000);

  // Modal state
  const [selectedSiteForSample, setSelectedSiteForSample] = useState<Site | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Local filter
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'recommended' | 'routine'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'none' | 'pending' | 'collected' | 'analyzed'>('all');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [queue, curve] = await Promise.all([
        repository.getSamplingQueue(ecosystemFilter),
        repository.getCostUncertaintyCurve(),
      ]);
      setQueueSites(queue);
      setCostCurve(curve);
      setLoading(false);
    }
    loadData();
  }, [ecosystemFilter]);

  // Handle sample dispatch confirmation
  const handleConfirmDispatch = async (siteId: string) => {
    await repository.updateSamplingStatus(siteId, 'pending');
    setQueueSites((prev) =>
      prev.map((s) => (s.id === siteId ? { ...s, samplingStatus: 'pending' } : s))
    );
  };

  // Filtered queue
  const filteredQueue = useMemo(() => {
    return queueSites.filter((site) => {
      if (priorityFilter !== 'all' && site.samplingPriority !== priorityFilter) return false;
      if (statusFilter !== 'all' && site.samplingStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          site.name.toLowerCase().includes(q) ||
          site.id.toLowerCase().includes(q) ||
          site.district.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [queueSites, priorityFilter, statusFilter, searchQuery]);

  // Calculate budget allocation simulation
  const simulationResult = useMemo(() => {
    return calculateCumulativeUncertaintyReduction(queueSites, simulationBudget);
  }, [queueSites, simulationBudget]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-slate-200 rounded-xl" />
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Adaptive Lab Sampling Queue
            </h1>
            <Badge variant="outline" size="sm" className="font-mono text-teal-800 bg-teal-50">
              Active Learning Loop
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl">
            Uncertainty-directed active learning queue: ranks monitored sites by model predictive variance, optimizing physical soil core collection budget to maximize carbon stock estimation accuracy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip content={GLOSSARY.ADAPTIVE_SAMPLING}>
            <div className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 font-medium">
              <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
              <span>Active Sampling Protocol</span>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-600">Queue Total Sites</span>
            <FlaskConical className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{queueSites.length}</span>
            <span className="text-xs text-slate-500">sites ranked</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 pt-1 border-t border-slate-100">
            Sorted by prediction variance (highest first)
          </p>
        </Card>

        <Card variant="default">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-600">Urgent Priority Sites</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-700">
              {queueSites.filter((s) => s.samplingPriority === 'urgent').length}
            </span>
            <span className="text-xs text-slate-500">require immediate core</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 pt-1 border-t border-slate-100">
            High variance or sensor drift flags
          </p>
        </Card>

        <Card variant="default">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-600">Pending Field Dispatches</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-700">
              {queueSites.filter((s) => s.samplingStatus === 'pending').length}
            </span>
            <span className="text-xs text-slate-500">dispatched to team</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 pt-1 border-t border-slate-100">
            Awaiting field collection & lab receipt
          </p>
        </Card>

        <Card variant="bluecarbon">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-teal-800">Simulated Reduction</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-teal-950">
              {simulationResult.expectedAvgReductionPct}%
            </span>
            <span className="text-xs text-teal-800">mean variance drop</span>
          </div>
          <p className="text-[11px] text-teal-700 mt-2 pt-1 border-t border-teal-200/60 font-mono">
            With {formatBDT(simulationBudget)} budget
          </p>
        </Card>
      </div>

      {/* Cost vs Uncertainty Reduction Interactive Frontier */}
      <Card variant="default">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-700" />
              <span>Cost vs. Expected Uncertainty Reduction (Pareto Frontier)</span>
            </div>
          }
          subtitle="Active learning marginal information gain: diminishing variance reduction per incremental BDT spent"
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Budget Slider:</span>
              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {formatBDT(simulationBudget)}
              </span>
            </div>
          }
        />

        <div className="space-y-4">
          <CostUncertaintyChart data={costCurve} currentBudget={simulationBudget} height={220} />

          {/* Interactive Budget Control Slider */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="budget-slider" className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                Simulate Budget Allocation:
              </label>
              <span className="font-mono text-slate-600">
                Dispatches <strong>{simulationResult.sampledSites.length}</strong> highest-variance sites • Total: <strong>{formatBDT(simulationResult.totalCostBDT)}</strong>
              </span>
            </div>
            <input
              id="budget-slider"
              type="range"
              min="20000"
              max="450000"
              step="10000"
              value={simulationBudget}
              onChange={(e) => setSimulationBudget(Number(e.target.value))}
              className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>৳20,000 (Min)</span>
              <span>৳150,000</span>
              <span>৳300,000</span>
              <span>৳450,000 (Max Coverage)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-subtle">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search queue by site name, district, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-[11px] text-slate-500 font-medium px-1">Priority:</span>
            {(['all', 'urgent', 'recommended', 'routine'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={cn(
                  'px-2 py-0.5 rounded capitalize font-medium transition-colors',
                  priorityFilter === p ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-[11px] text-slate-500 font-medium px-1">Status:</span>
            {(['all', 'none', 'pending', 'collected', 'analyzed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-2 py-0.5 rounded capitalize font-medium transition-colors',
                  statusFilter === st ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {st === 'none' ? 'Ready' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Queue Ranked Table */}
      <Card variant="default" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Site & Location</th>
                <th className="py-3 px-4">Ecosystem</th>
                <th className="py-3 px-4">Estimated Carbon Stock</th>
                <th className="py-3 px-4">Uncertainty (95% CI)</th>
                <th className="py-3 px-4">Exp. Reduction</th>
                <th className="py-3 px-4">Lab Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No sites matching the active sampling filters.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((site, idx) => {
                  const isSimulated = simulationResult.sampledSites.some((s) => s.id === site.id);
                  const isAgri = site.ecosystem === 'agriculture';

                  return (
                    <tr
                      key={site.id}
                      className={cn(
                        'hover:bg-slate-50/80 transition-colors',
                        isSimulated ? 'bg-teal-50/20' : ''
                      )}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        #{idx + 1}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
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
                      </td>

                      {/* Site & Location */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/sites/${site.id}`}
                          className="font-bold text-slate-900 hover:text-emerald-800 flex items-center gap-1 group"
                        >
                          <span>{site.name}</span>
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <span className="text-[11px] text-slate-400 block">
                          {site.id} • {site.district}
                        </span>
                      </td>

                      {/* Ecosystem */}
                      <td className="py-3 px-4">
                        <EcosystemBadge ecosystem={site.ecosystem} />
                      </td>

                      {/* Estimated Stock */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {formatStockWithCI(site.estimatedStock, site.uncertaintyCI95)}
                      </td>

                      {/* Uncertainty Width */}
                      <td className="py-3 px-4 font-mono">
                        <span
                          className={`font-semibold ${
                            site.uncertaintyCI95 > 10 ? 'text-red-700' : 'text-slate-700'
                          }`}
                        >
                          ±{site.uncertaintyCI95.toFixed(1)} t
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          ({site.uncertaintyPercent}%)
                        </span>
                      </td>

                      {/* Expected Reduction */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        ~{site.expectedUncertaintyReduction}%
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {formatBDT(site.estimatedSamplingCostBDT)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {site.samplingStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium text-[11px]">
                            <Clock className="w-3 h-3" /> Dispatched
                          </span>
                        )}
                        {site.samplingStatus === 'collected' && (
                          <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-medium text-[11px]">
                            In Transit
                          </span>
                        )}
                        {site.samplingStatus === 'analyzed' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> Analyzed
                          </span>
                        )}
                        {site.samplingStatus === 'none' && (
                          <span className="text-slate-400 text-[11px]">Ready to sample</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {site.samplingStatus === 'pending' ? (
                          <span className="text-slate-400 font-medium text-[11px]">Dispatched</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedSiteForSample(site);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
                          >
                            <FlaskConical className="w-3 h-3" />
                            Request Lab Sample
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <RequestSampleModal
        site={selectedSiteForSample}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDispatch}
      />
    </div>
  );
}
