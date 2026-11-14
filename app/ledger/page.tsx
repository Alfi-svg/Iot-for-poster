'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { repository } from '@/lib/repository';
import { useDashboardStore } from '@/lib/store';
import { LedgerRecord, EcosystemFilter, ReviewerStatus } from '@/types';
import {
  formatStockWithCI,
  formatShortHash,
  formatDateTime,
  formatDate,
} from '@/lib/utils/formatters';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, EcosystemBadge } from '@/components/ui/Badge';
import { Tooltip, GLOSSARY } from '@/components/ui/Tooltip';
import { ProvenanceChainView } from '@/components/ledger/ProvenanceChainView';
import { VersionDiffModal } from '@/components/ledger/VersionDiffModal';
import {
  ShieldCheck,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  GitCompare,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

function LedgerContent() {
  const searchParams = useSearchParams();
  const initialSiteId = searchParams.get('siteId');

  const { ecosystemFilter, setEcosystemFilter } = useDashboardStore();
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded provenance row state
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Version Diff state
  const [diffPair, setDiffPair] = useState<{ recordA: LedgerRecord; recordB: LedgerRecord } | null>(null);
  const [isDiffOpen, setIsDiffOpen] = useState(false);

  // Local filter states
  const [searchQuery, setSearchQuery] = useState(initialSiteId || '');
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewerStatus>('all');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    async function loadLedger() {
      setLoading(true);
      const data = await repository.getLedgerRecords({ ecosystem: ecosystemFilter });
      setRecords(data);
      // Auto-expand if single site requested
      if (initialSiteId) {
        const found = data.find((r) => r.siteId === initialSiteId);
        if (found) setExpandedRecordId(found.id);
      }
      setLoading(false);
    }
    loadLedger();
  }, [ecosystemFilter, initialSiteId]);

  const copyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleOpenDiff = async (record: LedgerRecord) => {
    // Find previous version for this site
    const siteVersions = await repository.getLedgerVersionsForSite(record.siteId);
    const prev = siteVersions.find((r) => r.id !== record.id && r.version < record.version);
    if (prev) {
      setDiffPair({ recordA: record, recordB: prev });
      setIsDiffOpen(true);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== 'all' && r.reviewerStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          r.siteName.toLowerCase().includes(q) ||
          r.siteId.toLowerCase().includes(q) ||
          r.dataHash.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded" />
        <div className="h-20 bg-slate-200 rounded-xl" />
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
              Auditable dMRV Ledger
            </h1>
            <Badge variant="outline" size="sm" className="font-mono text-emerald-800 bg-emerald-50">
              SHA-256 Provenance Chain
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl">
            Immutable, version-controlled records of estimated carbon stock. Each entry links sensor payload hashes, automated QC validation, soil core calibration anchors, and DA-UQ model outputs into a tamper-evident audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Audit Report Generator
          </Link>
        </div>
      </div>

      {/* Ledger Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-slate-500 block text-[11px]">Total Ledger Records</span>
          <span className="font-mono text-lg font-bold text-slate-900">{records.length}</span>
          <span className="text-[10px] text-slate-400 block">Versioned entries</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-slate-500 block text-[11px]">Audited & Verified</span>
          <span className="font-mono text-lg font-bold text-emerald-800">
            {records.filter((r) => r.reviewerStatus === 'audited').length}
          </span>
          <span className="text-[10px] text-slate-400 block">Passes all QC checks</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-slate-500 block text-[11px]">Pending Peer Review</span>
          <span className="font-mono text-lg font-bold text-blue-700">
            {records.filter((r) => r.reviewerStatus === 'pending_review').length}
          </span>
          <span className="text-[10px] text-slate-400 block">Awaiting secondary audit</span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-slate-500 block text-[11px]">Flagged Records</span>
          <span className="font-mono text-lg font-bold text-amber-700">
            {records.filter((r) => r.reviewerStatus === 'flagged').length}
          </span>
          <span className="text-[10px] text-slate-400 block">Requires sensor recalibration</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-subtle">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Record ID, Site, District, SHA-256 Hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-[11px] text-slate-500 font-medium px-1">Status:</span>
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'audited', label: 'Audited' },
                { id: 'pending_review', label: 'Pending' },
                { id: 'flagged', label: 'Flagged ⚠' },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={cn(
                  'px-2 py-0.5 rounded font-medium transition-colors',
                  statusFilter === st.id
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <Card variant="default" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Site Name</th>
                <th className="py-3 px-4">Ecosystem</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Estimated Carbon Stock</th>
                <th className="py-3 px-4">Model Engine</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No ledger records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isExpanded = expandedRecordId === record.id;
                  const isAgri = record.ecosystem === 'agriculture';

                  return (
                    <React.Fragment key={`${record.id}-${record.version}`}>
                      <tr
                        className={cn(
                          'hover:bg-slate-50/80 transition-colors',
                          isExpanded ? 'bg-slate-50/90' : ''
                        )}
                      >
                        {/* Expand Button */}
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() =>
                              setExpandedRecordId(isExpanded ? null : record.id)
                            }
                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700"
                            title={isExpanded ? 'Collapse Provenance' : 'Expand Provenance Chain'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-emerald-800" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Record ID */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {record.id}
                        </td>

                        {/* Site Name */}
                        <td className="py-3 px-4">
                          <Link
                            href={`/sites/${record.siteId}`}
                            className="font-bold text-slate-900 hover:text-emerald-800"
                          >
                            {record.siteName}
                          </Link>
                          <span className="text-[11px] text-slate-400 block">
                            {record.siteId} • {record.district}
                          </span>
                        </td>

                        {/* Ecosystem */}
                        <td className="py-3 px-4">
                          <EcosystemBadge ecosystem={record.ecosystem} />
                        </td>

                        {/* Version */}
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {record.version}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {formatDateTime(record.timestamp)}
                        </td>

                        {/* Estimated Stock */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {formatStockWithCI(record.estimatedStock, record.uncertaintyCI95)}
                        </td>

                        {/* Model Version */}
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {record.modelVersion}
                        </td>

                        {/* Data Hash with Copy */}
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200 w-fit">
                            <span className="text-slate-600 truncate max-w-[90px]" title={record.dataHash}>
                              {formatShortHash(record.dataHash, 6)}
                            </span>
                            <button
                              onClick={() => copyHash(record.dataHash, `${record.id}-${record.version}`)}
                              className="text-slate-400 hover:text-slate-800"
                              title="Copy SHA-256 Hash"
                            >
                              {copiedHash === `${record.id}-${record.version}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Reviewer Status */}
                        <td className="py-3 px-4">
                          {record.reviewerStatus === 'audited' && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Audited
                            </span>
                          )}
                          {record.reviewerStatus === 'pending_review' && (
                            <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-medium text-[11px]">
                              <Clock className="w-3 h-3" /> Pending Review
                            </span>
                          )}
                          {record.reviewerStatus === 'flagged' && (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold text-[11px]">
                              <AlertTriangle className="w-3 h-3" /> Flagged
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDiff(record)}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 inline-flex items-center gap-1 text-[11px] font-medium"
                              title="Compare with Previous Version"
                            >
                              <GitCompare className="w-3.5 h-3.5" />
                              <span>Diff</span>
                            </button>
                            <button
                              onClick={() =>
                                setExpandedRecordId(isExpanded ? null : record.id)
                              }
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] transition-colors"
                            >
                              {isExpanded ? 'Hide' : 'Inspect'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Provenance Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={11} className="p-4 bg-slate-100/60 border-t border-b border-slate-200">
                            <ProvenanceChainView
                              provenance={record.provenance}
                              recordId={record.id}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Version Diff Modal */}
      <VersionDiffModal
        recordA={diffPair?.recordA || null}
        recordB={diffPair?.recordB || null}
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
      />
    </div>
  );
}

export default function LedgerPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 font-mono">
          Loading Auditable dMRV Ledger...
        </div>
      }
    >
      <LedgerContent />
    </Suspense>
  );
}
