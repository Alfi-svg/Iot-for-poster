'use client';

import React, { useState } from 'react';
import { Site } from '@/types';
import { formatStockWithCI, formatBDT } from '@/lib/utils/formatters';
import { EcosystemBadge } from '@/components/ui/Badge';
import { X, FlaskConical, CheckCircle2, AlertCircle } from 'lucide-react';

interface RequestSampleModalProps {
  site: Site | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (siteId: string) => void;
}

export function RequestSampleModal({
  site,
  isOpen,
  onClose,
  onConfirm,
}: RequestSampleModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  if (!isOpen || !site) return null;

  const isAgri = site.ecosystem === 'agriculture';

  const handleDispatch = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600)); // smooth interaction
    onConfirm(site.id);
    setSubmitting(false);
    setDispatched(true);
    setTimeout(() => {
      setDispatched(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden space-y-4">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Request Adaptive Lab Sampling</h3>
              <p className="text-xs text-slate-500">Active learning ground-truth protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {dispatched ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h4 className="font-bold text-slate-900 text-base">Sampling Dispatched!</h4>
              <p className="text-slate-500 max-w-xs mx-auto">
                Sampling requisition committed to field queue. Field soil core extraction logged for {site.name}.
              </p>
            </div>
          ) : (
            <>
              {/* Site Details Card */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-600">{site.id}</span>
                  <EcosystemBadge ecosystem={site.ecosystem} />
                </div>
                <div className="font-bold text-slate-900 text-sm">{site.name}</div>
                <div className="text-slate-500">
                  {site.upazila}, {site.district} • {site.coordinates.lat.toFixed(4)}°N, {site.coordinates.lng.toFixed(4)}°E
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono">
                  <span>Current Estimate:</span>
                  <span className="font-bold text-slate-900">
                    {formatStockWithCI(site.estimatedStock, site.uncertaintyCI95)}
                  </span>
                </div>
              </div>

              {/* Protocol Specs */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                  Sampling Protocol Specifications
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Depth Stratification</span>
                    <span className="font-medium text-slate-800">
                      {isAgri ? '3 Slices (0-60 cm)' : '4 Slices (0-100 cm)'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Testing Facility</span>
                    <span className="font-medium text-slate-800">
                      {isAgri ? 'BARC Soil Chemistry, Dhaka' : 'Khulna Univ. Marine Lab'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Analytical Method</span>
                    <span className="font-medium text-slate-800">CHN Dry Combustion</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Replicate Density</span>
                    <span className="font-medium text-slate-800">5 Cores Composite</span>
                  </div>
                </div>
              </div>

              {/* Cost & Information Gain Callout */}
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 space-y-1.5">
                <div className="flex items-center justify-between text-teal-900 font-semibold">
                  <span>Estimated Sampling Cost:</span>
                  <span className="font-mono text-sm">{formatBDT(site.estimatedSamplingCostBDT)}</span>
                </div>
                <div className="flex items-center justify-between text-teal-800">
                  <span>Expected Variance Reduction:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    ~{site.expectedUncertaintyReduction}%
                  </span>
                </div>
                <p className="text-[11px] text-teal-700 pt-1 border-t border-teal-200/60">
                  Field team will receive notification with GPS boundary and depth protocol.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!dispatched && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleDispatch}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-teal-800 text-white font-semibold hover:bg-teal-900 text-xs shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'Dispatching...' : 'Confirm Field Dispatch'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
