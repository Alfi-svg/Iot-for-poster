'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  FlaskConical,
  ShieldCheck,
  LineChart,
  FileText,
  TreePine,
  ChevronLeft,
  ChevronRight,
  Sprout,
  Waves,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Tooltip, GLOSSARY } from '@/components/ui/Tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function Sidebar({ collapsed, onToggleCollapse, className }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Overview',
      href: '/',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      label: 'Spatial Map',
      href: '/map',
      icon: MapPin,
      badge: '40 Sites',
    },
    {
      label: 'Adaptive Sampling',
      href: '/sampling',
      icon: FlaskConical,
      badge: 'Queue',
    },
    {
      label: 'MRV Ledger',
      href: '/ledger',
      icon: ShieldCheck,
      badge: 'Audit',
    },
    {
      label: 'Model Comparison',
      href: '/models',
      icon: LineChart,
      badge: 'DA-UQ',
    },
    {
      label: 'Reports & Export',
      href: '/reports',
      icon: FileText,
      badge: 'PDF/CSV',
    },
  ];

  return (
    <aside
      className={cn(
        'relative bg-[#14532D] text-slate-100 flex flex-col justify-between transition-all duration-200 ease-in-out border-r border-emerald-950 z-40',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Top Branding */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-900/60">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/90 flex items-center justify-center text-white shadow-inner flex-shrink-0">
              <TreePine className="w-5 h-5 text-emerald-100" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight text-white leading-tight truncate">
                  CarbonMRV
                </span>
                <span className="text-[11px] font-mono text-emerald-300 font-medium tracking-wider uppercase">
                  Bangladesh dMRV
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 rounded-md text-emerald-300 hover:text-white hover:bg-emerald-800/80 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                  isActive
                    ? 'bg-emerald-700/90 text-white shadow-sm font-semibold'
                    : 'text-emerald-100/80 hover:bg-emerald-800/60 hover:text-white'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105',
                    isActive ? 'text-white' : 'text-emerald-300'
                  )}
                />

                {!collapsed && (
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="truncate">{item.label}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded font-mono font-medium',
                        isActive
                          ? 'bg-emerald-900/60 text-emerald-200'
                          : 'bg-emerald-950/40 text-emerald-300/80'
                      )}
                    >
                      {item.badge}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Ecosystem & Research Info */}
      <div className="p-3 border-t border-emerald-900/60 space-y-2">
        {!collapsed && (
          <div className="bg-emerald-950/50 p-3 rounded-lg border border-emerald-800/50 text-xs space-y-2">
            <div className="flex items-center justify-between text-emerald-200 font-medium">
              <span className="flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                Agriculture
              </span>
              <span className="font-mono font-semibold text-white">25 sites</span>
            </div>
            <div className="flex items-center justify-between text-emerald-200 font-medium">
              <span className="flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-teal-400" />
                Blue Carbon
              </span>
              <span className="font-mono font-semibold text-white">15 sites</span>
            </div>
            <div className="pt-1.5 border-t border-emerald-900/80 flex items-center justify-between text-[11px] text-emerald-300/80">
              <span>Framework:</span>
              <Tooltip content="IoT-ML Digital MRV framework modeling Soil Organic Carbon in farmland and Blue Carbon in coastal mangrove ecosystems.">
                <span className="flex items-center gap-1 text-emerald-200 font-mono underline decoration-dotted">
                  DA-UQ dMRV
                  <Info className="w-3 h-3" />
                </span>
              </Tooltip>
            </div>
          </div>
        )}
        
        <div className="text-[10px] text-emerald-300/60 text-center px-1 font-mono">
          {!collapsed ? 'v0.9.4-alpha • Demo Data Only' : 'v0.9'}
        </div>
      </div>
    </aside>
  );
}
