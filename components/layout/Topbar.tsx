'use client';

import React from 'react';
import { useDashboardStore } from '@/lib/store';
import { EcosystemFilter } from '@/types';
import { Search, AlertTriangle, Layers, Sprout, Waves } from 'lucide-react';
import { Tooltip, GLOSSARY } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils/cn';

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { ecosystemFilter, setEcosystemFilter, searchQuery, setSearchQuery } = useDashboardStore();

  const filterButtons: Array<{ id: EcosystemFilter; label: string; icon: React.ReactNode; activeColor: string }> = [
    {
      id: 'all',
      label: 'All Ecosystems',
      icon: <Layers className="w-4 h-4" />,
      activeColor: 'bg-slate-900 text-white shadow-sm',
    },
    {
      id: 'agriculture',
      label: 'Agriculture',
      icon: <Sprout className="w-4 h-4 text-emerald-500" />,
      activeColor: 'bg-emerald-800 text-white shadow-sm',
    },
    {
      id: 'blue_carbon',
      label: 'Blue Carbon',
      icon: <Waves className="w-4 h-4 text-teal-400" />,
      activeColor: 'bg-teal-800 text-white shadow-sm',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sites by district, division, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Center: Ecosystem Toggle */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
          {filterButtons.map((btn) => {
            const isActive = ecosystemFilter === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setEcosystemFilter(btn.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150',
                  isActive ? btn.activeColor : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                )}
                aria-pressed={isActive}
              >
                {btn.icon}
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Persistent Honesty Badge */}
        <div className="flex items-center gap-2">
          <Tooltip
            content="Strict Honesty Protocol: All carbon stock estimates and telemetry shown are synthetically generated for research demonstration. Data is not verified carbon removal and cannot be traded as carbon credits."
          >
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300/80 rounded-full text-amber-900 text-xs font-medium shadow-sm hover:bg-amber-100 transition-colors">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 animate-pulse" />
              <span className="font-semibold tracking-tight">Demo data – not field-verified</span>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Mobile Ecosystem bar */}
      <div className="flex md:hidden items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500 font-medium">Ecosystem:</span>
        <div className="flex items-center gap-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setEcosystemFilter(btn.id)}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                ecosystemFilter === btn.id ? btn.activeColor : 'text-slate-600 bg-slate-100'
              )}
            >
              {btn.label.replace(' Ecosystems', '')}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
