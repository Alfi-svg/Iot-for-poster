'use client';

import React from 'react';
import { EcosystemFilter } from '@/types';
import { Search, Filter, RotateCcw, Sprout, Waves, AlertTriangle } from 'lucide-react';
import { Tooltip, GLOSSARY } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils/cn';

interface MapFilterPanelProps {
  ecosystem: EcosystemFilter;
  setEcosystem: (eco: EcosystemFilter) => void;
  uncertaintyFilter: 'all' | 'low' | 'moderate' | 'high';
  setUncertaintyFilter: (val: 'all' | 'low' | 'moderate' | 'high') => void;
  qualityFilter: 'all' | 'clean' | 'flagged';
  setQualityFilter: (val: 'all' | 'clean' | 'flagged') => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  matchingCount: number;
  totalCount: number;
  onReset: () => void;
}

export function MapFilterPanel({
  ecosystem,
  setEcosystem,
  uncertaintyFilter,
  setUncertaintyFilter,
  qualityFilter,
  setQualityFilter,
  searchQuery,
  setSearchQuery,
  matchingCount,
  totalCount,
  onReset,
}: MapFilterPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-800" />
          <h3 className="font-semibold text-slate-900 text-sm">Spatial Filter</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {matchingCount} / {totalCount} Sites
          </span>
          <button
            onClick={onReset}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
          Search Location
        </label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search district, site name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
          />
        </div>
      </div>

      {/* Ecosystem Filter */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
          Ecosystem
        </label>
        <div className="grid grid-cols-3 gap-1">
          {(['all', 'agriculture', 'blue_carbon'] as const).map((eco) => {
            const isActive = ecosystem === eco;
            const labels = {
              all: 'All',
              agriculture: 'Agri',
              blue_carbon: 'Blue',
            };
            return (
              <button
                key={eco}
                onClick={() => setEcosystem(eco)}
                className={cn(
                  'py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center',
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                )}
              >
                {labels[eco]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Uncertainty Range */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Predictive Uncertainty
          </label>
          <Tooltip content={GLOSSARY.CI} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: 'all', label: 'All Ranges' },
              { id: 'low', label: 'Low (< 5 t)' },
              { id: 'moderate', label: 'Mid (5-15 t)' },
              { id: 'high', label: 'High (> 15 t)' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setUncertaintyFilter(item.id)}
              className={cn(
                'py-1 px-2 rounded-md text-[11px] font-medium transition-colors border text-left',
                uncertaintyFilter === item.id
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Flags Filter */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
          Sensor QC Status
        </label>
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'clean', label: 'Clean Only' },
              { id: 'flagged', label: 'Flagged ⚠' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setQualityFilter(item.id)}
              className={cn(
                'py-1 px-1.5 rounded-md text-xs font-medium transition-colors border text-center',
                qualityFilter === item.id
                  ? item.id === 'flagged'
                    ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                    : 'bg-slate-900 text-white border-slate-900 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Map Legend */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
          Map Legend
        </label>
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-sm flex-shrink-0" />
            <span>Agriculture (Soil Organic Carbon)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white shadow-sm flex-shrink-0" />
            <span>Blue Carbon (Mangrove Sediment)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border border-dashed border-amber-600 bg-amber-100/50 flex-shrink-0" />
            <span>Outer Ring: Predictive Uncertainty Width</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-sm flex-shrink-0" />
            <span>Red Dot: Sensor QC Drift Flag</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="w-4 h-2.5 rounded border border-dashed border-emerald-500 bg-emerald-100/40 flex-shrink-0" />
            <span>Dashed Grid: Sentinel / Landsat Tiles</span>
          </div>
        </div>
      </div>
    </div>
  );
}
