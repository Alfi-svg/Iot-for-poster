import seedPayload from '@/data/seedData.json';
import {
  Site,
  EcosystemFilter,
  OverviewMetrics,
  ModelBenchmark,
  LedgerRecord,
  ActivityFeedItem,
} from '@/types';
import { CarbonDataRepository } from './interface';

class SyntheticDataRepository implements CarbonDataRepository {
  private sites: Site[];
  private ledgerRecords: LedgerRecord[];
  private modelBenchmarks: ModelBenchmark[];
  private activityFeed: ActivityFeedItem[];

  constructor() {
    // Clone seed data into memory
    this.sites = JSON.parse(JSON.stringify(seedPayload.sites));
    this.ledgerRecords = JSON.parse(JSON.stringify(seedPayload.ledgerRecords));
    this.modelBenchmarks = JSON.parse(JSON.stringify(seedPayload.modelBenchmarks));
    this.activityFeed = JSON.parse(JSON.stringify(seedPayload.activityFeed));
  }

  async getSites(filter?: { ecosystem?: EcosystemFilter; district?: string; search?: string }): Promise<Site[]> {
    let result = [...this.sites];

    if (filter?.ecosystem && filter.ecosystem !== 'all') {
      result = result.filter((s) => s.ecosystem === filter.ecosystem);
    }

    if (filter?.district) {
      const q = filter.district.toLowerCase();
      result = result.filter((s) => s.district.toLowerCase().includes(q));
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.landType.toLowerCase().includes(q)
      );
    }

    return result;
  }

  async getSiteById(id: string): Promise<Site | null> {
    const site = this.sites.find((s) => s.id === id);
    return site || null;
  }

  async getOverviewMetrics(ecosystem?: EcosystemFilter): Promise<OverviewMetrics> {
    const relevantSites =
      ecosystem && ecosystem !== 'all'
        ? this.sites.filter((s) => s.ecosystem === ecosystem)
        : this.sites;

    const count = relevantSites.length || 1;
    const totalArea = relevantSites.reduce((acc, s) => acc + s.areaHa, 0);
    const sumStock = relevantSites.reduce((acc, s) => acc + s.estimatedStock, 0);
    const sumCI = relevantSites.reduce((acc, s) => acc + s.uncertaintyCI95, 0);
    const flaggedSites = relevantSites.filter((s) => s.qualityFlagsCount > 0).length;
    const pendingSamples = relevantSites.filter(
      (s) => s.samplingStatus === 'pending' || s.samplingPriority === 'urgent'
    ).length;

    const meanStock = Number((sumStock / count).toFixed(1));
    const meanCI = Number((sumCI / count).toFixed(1));
    const meanPct = Number(((meanCI / (meanStock || 1)) * 100).toFixed(1));

    return {
      totalSites: relevantSites.length,
      agricultureSites: relevantSites.filter((s) => s.ecosystem === 'agriculture').length,
      blueCarbonSites: relevantSites.filter((s) => s.ecosystem === 'blue_carbon').length,
      meanEstimatedStock: meanStock,
      meanUncertaintyCI95: meanCI,
      meanUncertaintyPercent: meanPct,
      flaggedSitesPercentage: Number(((flaggedSites / count) * 100).toFixed(1)),
      pendingLabSamples: pendingSamples,
      totalMonitoredAreaHa: totalArea,
    };
  }

  async getActivityFeed(limit = 10): Promise<ActivityFeedItem[]> {
    return this.activityFeed.slice(0, limit);
  }

  async getHistoricalStockTrend(ecosystem?: EcosystemFilter): Promise<
    Array<{
      month: string;
      meanStock: number;
      ciLower: number;
      ciUpper: number;
      sampleCount: number;
    }>
  > {
    const relevant =
      ecosystem && ecosystem !== 'all'
        ? this.sites.filter((s) => s.ecosystem === ecosystem)
        : this.sites;

    const baseMean =
      relevant.reduce((acc, s) => acc + s.estimatedStock, 0) / (relevant.length || 1);
    const baseCI =
      relevant.reduce((acc, s) => acc + s.uncertaintyCI95, 0) / (relevant.length || 1);

    const months = ['Jun 2024', 'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024'];
    const variations = [-2.4, -1.8, -0.6, +0.8, +1.4, +2.1];

    return months.map((month, idx) => {
      const v = variations[idx];
      const stock = Number((baseMean + v).toFixed(1));
      const ci = Number((baseCI * (1 - idx * 0.04)).toFixed(1)); // slightly tightening uncertainty as data assimilates
      return {
        month,
        meanStock: stock,
        ciLower: Number((stock - ci).toFixed(1)),
        ciUpper: Number((stock + ci).toFixed(1)),
        sampleCount: relevant.length * 30,
      };
    });
  }

  async getModelBenchmarks(): Promise<ModelBenchmark[]> {
    return this.modelBenchmarks;
  }

  async getIntervalCoverageData(): Promise<
    Array<{
      predictedRank: number;
      observedValue: number;
      predMean: number;
      ciLower: number;
      ciUpper: number;
      inInterval: boolean;
    }>
  > {
    const points: Array<{
      predictedRank: number;
      observedValue: number;
      predMean: number;
      ciLower: number;
      ciUpper: number;
      inInterval: boolean;
    }> = [];

    // 40 validation points sorted by predicted value
    const sorted = [...this.sites].sort((a, b) => a.estimatedStock - b.estimatedStock);
    sorted.forEach((site, idx) => {
      const predMean = site.estimatedStock;
      const ci = site.uncertaintyCI95;
      const ciLower = Number((predMean - ci).toFixed(1));
      const ciUpper = Number((predMean + ci).toFixed(1));

      // In 95% nominal coverage, ~95% fall within interval
      const noise = ((idx % 19 === 0) ? 1.25 : 0.45) * (idx % 2 === 0 ? 1 : -1) * (ci * 0.9);
      const observed = Number((predMean + noise).toFixed(1));
      const inInterval = observed >= ciLower && observed <= ciUpper;

      points.push({
        predictedRank: idx + 1,
        predMean,
        observedValue: observed,
        ciLower,
        ciUpper,
        inInterval,
      });
    });

    return points;
  }

  async getSamplingQueue(ecosystem?: EcosystemFilter): Promise<Site[]> {
    let list = [...this.sites];
    if (ecosystem && ecosystem !== 'all') {
      list = list.filter((s) => s.ecosystem === ecosystem);
    }
    // Highest predictive uncertainty first (Active Learning prioritization)
    return list.sort((a, b) => b.uncertaintyCI95 - a.uncertaintyCI95);
  }

  async updateSamplingStatus(siteId: string, status: Site['samplingStatus']): Promise<boolean> {
    const site = this.sites.find((s) => s.id === siteId);
    if (!site) return false;
    site.samplingStatus = status;
    return true;
  }

  async getCostUncertaintyCurve(): Promise<
    Array<{
      budgetBDT: number;
      sitesSampled: number;
      aggregateUncertaintyReductionPct: number;
    }>
  > {
    return [
      { budgetBDT: 0, sitesSampled: 0, aggregateUncertaintyReductionPct: 0 },
      { budgetBDT: 50000, sitesSampled: 4, aggregateUncertaintyReductionPct: 18.2 },
      { budgetBDT: 100000, sitesSampled: 8, aggregateUncertaintyReductionPct: 31.5 },
      { budgetBDT: 150000, sitesSampled: 12, aggregateUncertaintyReductionPct: 42.0 },
      { budgetBDT: 200000, sitesSampled: 16, aggregateUncertaintyReductionPct: 49.8 },
      { budgetBDT: 300000, sitesSampled: 24, aggregateUncertaintyReductionPct: 58.4 },
      { budgetBDT: 450000, sitesSampled: 36, aggregateUncertaintyReductionPct: 63.9 },
    ];
  }

  async getLedgerRecords(filter?: { siteId?: string; ecosystem?: EcosystemFilter }): Promise<LedgerRecord[]> {
    let result = [...this.ledgerRecords];
    if (filter?.siteId) {
      result = result.filter((r) => r.siteId === filter.siteId);
    }
    if (filter?.ecosystem && filter.ecosystem !== 'all') {
      result = result.filter((r) => r.ecosystem === filter.ecosystem);
    }
    return result;
  }

  async getLedgerRecordById(id: string): Promise<LedgerRecord | null> {
    const record = this.ledgerRecords.find((r) => r.id === id);
    return record || null;
  }

  async getLedgerVersionsForSite(siteId: string): Promise<LedgerRecord[]> {
    return this.ledgerRecords
      .filter((r) => r.siteId === siteId)
      .sort((a, b) => b.version.localeCompare(a.version));
  }
}

export const repository = new SyntheticDataRepository();
