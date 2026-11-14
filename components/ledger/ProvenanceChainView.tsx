'use client';

import React from 'react';
import { ProvenanceChain } from '@/types';
import { formatStockWithCI, formatShortHash } from '@/lib/utils/formatters';
import {
  Radio,
  ShieldCheck,
  FlaskConical,
  Cpu,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

interface ProvenanceChainViewProps {
  provenance: ProvenanceChain;
  recordId: string;
}

export function ProvenanceChainView({ provenance, recordId }: ProvenanceChainViewProps) {
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const steps = [
    {
      step: 1,
      title: 'Raw Sensor & Satellite Ingestion',
      icon: Radio,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      details: [
        { label: 'Ingested Telemetry Packets', value: provenance.rawSensorIngestion.packetsCount.toLocaleString() },
        { label: 'Satellite Tile', value: provenance.rawSensorIngestion.satelliteTile },
        { label: 'Ingestion Timestamp', value: provenance.rawSensorIngestion.ingestionTimestamp },
      ],
      hash: provenance.rawSensorIngestion.rawPayloadHash,
      hashLabel: 'Raw Ingestion Hash',
    },
    {
      step: 2,
      title: 'Automated QC & Outlier Filter',
      icon: ShieldCheck,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      details: [
        { label: 'Automated QC Rules Evaluated', value: `${provenance.qualityControl.qcRulesEvaluated} Standard Rules` },
        { label: 'Filtered Sensor Anomalies', value: `${provenance.qualityControl.filteredAnomalies} readings` },
        { label: 'Quality Assessment', value: provenance.qualityControl.flagSummary },
      ],
      hash: provenance.qualityControl.qcPassHash,
      hashLabel: 'QC Check Hash',
    },
    {
      step: 3,
      title: 'Lab Physical Core Calibration',
      icon: FlaskConical,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      details: [
        { label: 'Anchor Soil Sample ID', value: provenance.calibration.anchorLabSampleId },
        { label: 'Reference SOC %', value: `${provenance.calibration.labSocPercent}%` },
        { label: 'Bulk Density Reference', value: `${provenance.calibration.bulkDensity} g/cm³` },
        { label: 'Calibration Shift', value: provenance.calibration.calibrationOffset },
      ],
      hash: null,
      hashLabel: null,
    },
    {
      step: 4,
      title: 'ML Inference & Variance Quantification',
      icon: Cpu,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      details: [
        { label: 'Inference Model Engine', value: provenance.mlInference.modelVersion },
        { label: 'Feature Input Vectors', value: `${provenance.mlInference.featureCount} multimodal features` },
        { label: 'Ensemble Epistemic Variance', value: `σ² = ${provenance.mlInference.ensembleVariance}` },
        { label: 'Inference Run ID', value: provenance.mlInference.inferenceRunId },
      ],
      hash: null,
      hashLabel: null,
    },
    {
      step: 5,
      title: 'Final Estimated Stock & CI Interval',
      icon: CheckCircle2,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      details: [
        {
          label: 'Estimated Carbon Stock',
          value: formatStockWithCI(
            provenance.outputSummary.estimatedStock,
            provenance.outputSummary.ci95Width,
            provenance.outputSummary.unit
          ),
          highlight: true,
        },
        {
          label: '95% Confidence Bounds',
          value: `[${provenance.outputSummary.ciLower} – ${provenance.outputSummary.ciUpper}] ${provenance.outputSummary.unit}`,
        },
        { label: 'Status', value: 'Audited & Ledger-Committed' },
      ],
      hash: null,
      hashLabel: null,
    },
  ];

  return (
    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Cryptographic Provenance Lineage ({recordId})
          </h4>
          <p className="text-[11px] text-slate-500">
            End-to-end traceable pipeline from raw packet telemetry to finalized uncertainty-bounded carbon stock estimate.
          </p>
        </div>
      </div>

      {/* Steps Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="p-3 bg-white rounded-xl border border-slate-200 shadow-subtle flex flex-col justify-between text-xs space-y-2 relative"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold text-slate-400">STEP 0{s.step}</span>
                  <div className={`p-1 rounded-md border ${s.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="font-bold text-slate-900 text-xs leading-snug mb-2">
                  {s.title}
                </div>

                <div className="space-y-1.5 text-[11px]">
                  {s.details.map((d, dIdx) => (
                    <div key={dIdx} className="space-y-0.5">
                      <span className="text-slate-400 text-[10px] block leading-tight">{d.label}</span>
                      <span
                        className={`font-mono block truncate ${
                          (d as any).highlight ? 'font-bold text-emerald-800 text-xs' : 'text-slate-700 font-medium'
                        }`}
                      >
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hash if present */}
              {s.hash && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span className="truncate max-w-[100px]" title={s.hash}>
                    {formatShortHash(s.hash, 6)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(s.hash!, `step-${s.step}`)}
                    className="p-1 hover:text-slate-800 text-slate-400"
                    title="Copy Hash"
                  >
                    {copiedHash === `step-${s.step}` ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
