import { describe, it, expect } from 'vitest';
import { formatStockWithCI, formatBDT, formatPercent } from '../formatters';
import { generateSitesCSV, generateLedgerCSV } from '../export';
import { rankSitesForAdaptiveSampling, calculateCumulativeUncertaintyReduction } from '../ranking';
import { Site, LedgerRecord } from '@/types';

const mockSites: Site[] = [
  {
    id: 'BD-AG-001',
    name: 'Godagari Barind Plot',
    ecosystem: 'agriculture',
    division: 'Rajshahi',
    district: 'Rajshahi',
    upazila: 'Godagari',
    coordinates: { lat: 24.4682, lng: 88.3301 },
    areaHa: 100,
    landType: 'Terrace Clay',
    estimatedStock: 45.2,
    uncertaintyCI95: 3.5,
    uncertaintyPercent: 7.7,
    dataCompleteness: 98.0,
    qualityFlagsCount: 0,
    qualityFlags: [],
    sensorNodeCount: 4,
    lastTelemetryAt: '2024-11-15T06:00:00Z',
    lastLabSampleAt: '2024-04-18T00:00:00Z',
    activeModel: 'DA-UQ-v0.4b',
    mrvRecordId: 'MRV-BD-2024-AG-001',
    samplingPriority: 'routine',
    samplingStatus: 'none',
    estimatedSamplingCostBDT: 12000,
    expectedUncertaintyReduction: 35.0,
    soilCoreHistory: [],
    recentTelemetry: [],
  },
  {
    id: 'BD-BC-001',
    name: 'Chandpai Mangrove Core',
    ecosystem: 'blue_carbon',
    division: 'Khulna',
    district: 'Bagerhat',
    upazila: 'Mongla',
    coordinates: { lat: 22.3512, lng: 89.6801 },
    areaHa: 500,
    landType: 'Mature Sundari Stand',
    estimatedStock: 210.5,
    uncertaintyCI95: 22.8,
    uncertaintyPercent: 10.8,
    dataCompleteness: 92.0,
    qualityFlagsCount: 2,
    qualityFlags: [],
    sensorNodeCount: 6,
    lastTelemetryAt: '2024-11-15T06:00:00Z',
    lastLabSampleAt: '2024-03-12T00:00:00Z',
    activeModel: 'DA-UQ-v0.4b',
    mrvRecordId: 'MRV-BD-2024-BC-001',
    samplingPriority: 'urgent',
    samplingStatus: 'pending',
    estimatedSamplingCostBDT: 24000,
    expectedUncertaintyReduction: 48.0,
    soilCoreHistory: [],
    recentTelemetry: [],
  },
];

describe('Data Utility Functions', () => {
  it('formats carbon stock with CI interval adhering to honesty guidelines', () => {
    const formatted = formatStockWithCI(48.24, 5.12);
    expect(formatted).toBe('48.2 ± 5.1 t C/ha');
  });

  it('formats BDT currency and percentages correctly', () => {
    expect(formatBDT(15000)).toBe('৳15,000');
    expect(formatPercent(12.34)).toBe('12.3%');
  });

  it('ranks sites with highest uncertainty and flags first for adaptive sampling', () => {
    const ranked = rankSitesForAdaptiveSampling(mockSites);
    // Mangrove site has higher uncertainty (22.8 vs 3.5) and 2 quality flags
    expect(ranked[0].id).toBe('BD-BC-001');
    expect(ranked[1].id).toBe('BD-AG-001');
  });

  it('calculates cumulative uncertainty reduction within budget constraint', () => {
    const result = calculateCumulativeUncertaintyReduction(mockSites, 25000);
    // Budget 25,000 should pick the highest priority BD-BC-001 (cost 24,000)
    expect(result.sampledSites.length).toBe(1);
    expect(result.sampledSites[0].id).toBe('BD-BC-001');
    expect(result.totalCostBDT).toBe(24000);
    expect(result.expectedAvgReductionPct).toBe(48.0);
  });

  it('generates valid CSV string with headers and quoted fields', () => {
    const csv = generateSitesCSV(mockSites);
    expect(csv).toContain('Site ID,Site Name,Ecosystem');
    expect(csv).toContain('"BD-AG-001","Godagari Barind Plot"');
    expect(csv).toContain('"BD-BC-001","Chandpai Mangrove Core"');
  });
});
