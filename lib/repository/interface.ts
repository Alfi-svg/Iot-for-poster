import {
  Site,
  EcosystemFilter,
  OverviewMetrics,
  ModelBenchmark,
  LedgerRecord,
  ActivityFeedItem,
} from '@/types';

export interface CarbonDataRepository {
  // Sites
  getSites(filter?: { ecosystem?: EcosystemFilter; district?: string; search?: string }): Promise<Site[]>;
  getSiteById(id: string): Promise<Site | null>;
  
  // Overview KPIs
  getOverviewMetrics(ecosystem?: EcosystemFilter): Promise<OverviewMetrics>;
  getActivityFeed(limit?: number): Promise<ActivityFeedItem[]>;
  getHistoricalStockTrend(ecosystem?: EcosystemFilter): Promise<Array<{
    month: string;
    meanStock: number;
    ciLower: number;
    ciUpper: number;
    sampleCount: number;
  }>>;

  // Models
  getModelBenchmarks(): Promise<ModelBenchmark[]>;
  getIntervalCoverageData(): Promise<Array<{
    predictedRank: number;
    observedValue: number;
    predMean: number;
    ciLower: number;
    ciUpper: number;
    inInterval: boolean;
  }>>;

  // Sampling Queue
  getSamplingQueue(ecosystem?: EcosystemFilter): Promise<Site[]>;
  updateSamplingStatus(siteId: string, status: Site['samplingStatus']): Promise<boolean>;
  getCostUncertaintyCurve(): Promise<Array<{
    budgetBDT: number;
    sitesSampled: number;
    aggregateUncertaintyReductionPct: number;
  }>>;

  // MRV Ledger
  getLedgerRecords(filter?: { siteId?: string; ecosystem?: EcosystemFilter }): Promise<LedgerRecord[]>;
  getLedgerRecordById(id: string): Promise<LedgerRecord | null>;
  getLedgerVersionsForSite(siteId: string): Promise<LedgerRecord[]>;
}
