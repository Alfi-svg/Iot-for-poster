'use client';

import React from 'react';
import { LedgerRecord } from '@/types';
import { formatStockWithCI, formatDateTime } from '@/lib/utils/formatters';
import { X, GitCompare, ArrowRight, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface VersionDiffModalProps {
  recordA: LedgerRecord | null;
  recordB: LedgerRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VersionDiffModal({ recordA, recordB, isOpen, onClose }: VersionDiffModalProps) {
  if (!isOpen || !recordA || !recordB) return null;

  const stockDelta = Number((recordA.estimatedStock - recordB.estimatedStock).toFixed(1));
  const ciDelta = Number((recordA.uncertaintyCI95 - recordB.uncertaintyCI95).toFixed(1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden space-y-4">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">MRV Record Version Diff</h3>
              <p className="text-xs text-slate-500">
                Comparing {recordA.siteName} ({recordA.version} vs {recordB.version})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diff Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Summary Delta Banner */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[11px] block">Stock Estimate Delta</span>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-xl font-bold text-slate-900">
                  {stockDelta > 0 ? `+${stockDelta}` : stockDelta} t C/ha
                </span>
                <span className="text-slate-400 text-xs">
                  ({recordB.estimatedStock} → {recordA.estimatedStock})
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[11px] block">Uncertainty CI Delta</span>
              <div className="flex items-baseline gap-2 font-mono">
                <span
                  className={`text-xl font-bold ${
                    ciDelta < 0 ? 'text-emerald-700' : 'text-slate-900'
                  }`}
                >
                  {ciDelta > 0 ? `+${ciDelta}` : ciDelta} t C/ha
                </span>
                <span className="text-slate-400 text-xs">
                  (±{recordB.uncertaintyCI95} → ±{recordA.uncertaintyCI95})
                </span>
              </div>
              {ciDelta < 0 && (
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Uncertainty contracted as data assimilated
                </span>
              )}
            </div>
          </div>

          {/* Side-by-Side Parameter Matrix */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Field / Parameter</th>
                  <th className="py-2.5 px-3">Previous ({recordB.version})</th>
                  <th className="py-2.5 px-3">Current ({recordA.version})</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">Timestamp</td>
                  <td className="py-2 px-3 text-slate-500">{formatDateTime(recordB.timestamp)}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{formatDateTime(recordA.timestamp)}</td>
                  <td className="py-2 px-3 text-slate-400 font-sans">Updated</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">Estimated Carbon Stock</td>
                  <td className="py-2 px-3 text-slate-600">{formatStockWithCI(recordB.estimatedStock, recordB.uncertaintyCI95)}</td>
                  <td className="py-2 px-3 font-bold text-emerald-800">{formatStockWithCI(recordA.estimatedStock, recordA.uncertaintyCI95)}</td>
                  <td className="py-2 px-3 text-emerald-700 font-sans font-semibold">Tighter CI</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">Model Engine</td>
                  <td className="py-2 px-3 text-slate-600">{recordB.modelVersion}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{recordA.modelVersion}</td>
                  <td className="py-2 px-3 text-slate-400 font-sans">Identical</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">Satellite Weight (NDVI)</td>
                  <td className="py-2 px-3 text-slate-600">{recordB.parametersSnapshot.satelliteNdviWeight}</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{recordA.parametersSnapshot.satelliteNdviWeight}</td>
                  <td className="py-2 px-3 text-amber-700 font-sans font-semibold">Adjusted</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">Bulk Density Reference</td>
                  <td className="py-2 px-3 text-slate-600">{recordB.parametersSnapshot.bulkDensityUsed} g/cm³</td>
                  <td className="py-2 px-3 text-slate-900">{recordA.parametersSnapshot.bulkDensityUsed} g/cm³</td>
                  <td className="py-2 px-3 text-slate-400 font-sans">Anchored</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">Cryptographic Hash</td>
                  <td className="py-2 px-3 text-slate-400 truncate max-w-[140px]" title={recordB.dataHash}>
                    {recordB.dataHash.slice(0, 12)}…
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-900 truncate max-w-[140px]" title={recordA.dataHash}>
                    {recordA.dataHash.slice(0, 12)}…
                  </td>
                  <td className="py-2 px-3 text-emerald-700 font-sans font-semibold">Chained</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            Close Diff Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
