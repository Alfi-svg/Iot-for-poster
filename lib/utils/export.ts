import { Site, LedgerRecord } from '@/types';

/**
 * Converts a list of sites to clean, audit-ready CSV format.
 */
export function generateSitesCSV(sites: Site[]): string {
  const headers = [
    'Site ID',
    'Site Name',
    'Ecosystem',
    'Division',
    'District',
    'Upazila',
    'Latitude',
    'Longitude',
    'Area (ha)',
    'Land Type',
    'Estimated Carbon Stock (t C/ha)',
    '95% Uncertainty CI (± t C/ha)',
    'Uncertainty (%)',
    'Data Completeness (%)',
    'Quality Flags Count',
    'Active Model Version',
    'MRV Ledger ID',
    'Sampling Priority',
    'Sampling Status',
    'Estimated Lab Sampling Cost (BDT)',
  ];

  const rows = sites.map((s) => [
    `"${s.id}"`,
    `"${s.name.replace(/"/g, '""')}"`,
    `"${s.ecosystem}"`,
    `"${s.division}"`,
    `"${s.district}"`,
    `"${s.upazila}"`,
    s.coordinates.lat.toFixed(4),
    s.coordinates.lng.toFixed(4),
    s.areaHa,
    `"${s.landType.replace(/"/g, '""')}"`,
    s.estimatedStock.toFixed(1),
    s.uncertaintyCI95.toFixed(1),
    s.uncertaintyPercent.toFixed(1),
    s.dataCompleteness.toFixed(1),
    s.qualityFlagsCount,
    `"${s.activeModel}"`,
    `"${s.mrvRecordId}"`,
    `"${s.samplingPriority}"`,
    `"${s.samplingStatus}"`,
    s.estimatedSamplingCostBDT,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Converts ledger records to CSV.
 */
export function generateLedgerCSV(records: LedgerRecord[]): string {
  const headers = [
    'Record ID',
    'Site ID',
    'Site Name',
    'Ecosystem',
    'Version',
    'Timestamp',
    'Estimated Carbon Stock (t C/ha)',
    '95% CI (± t C/ha)',
    'Model Version',
    'Calibration Date',
    'Cryptographic Data Hash (SHA-256)',
    'Reviewer Status',
    'Quality Flags Count',
  ];

  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${r.siteId}"`,
    `"${r.siteName.replace(/"/g, '""')}"`,
    `"${r.ecosystem}"`,
    `"${r.version}"`,
    `"${r.timestamp}"`,
    r.estimatedStock.toFixed(1),
    r.uncertaintyCI95.toFixed(1),
    `"${r.modelVersion}"`,
    `"${r.calibrationDate}"`,
    `"${r.dataHash}"`,
    `"${r.reviewerStatus}"`,
    r.qualityFlagsCount,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Downloads a string as a file in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
