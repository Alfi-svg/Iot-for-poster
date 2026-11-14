import { Site } from '@/types';

/**
 * Ranks sites for adaptive ground-truth lab sampling.
 * Prioritizes:
 * 1. Higher absolute predictive uncertainty (uncertaintyCI95)
 * 2. Higher quality flags count (data anomalies / sensor drift)
 * 3. Lower data completeness
 */
export function rankSitesForAdaptiveSampling(sites: Site[]): Site[] {
  return [...sites].sort((a, b) => {
    // Composite scoring metric
    const scoreA = a.uncertaintyCI95 * 2.0 + a.qualityFlagsCount * 4.0 + (100 - a.dataCompleteness) * 0.5;
    const scoreB = b.uncertaintyCI95 * 2.0 + b.qualityFlagsCount * 4.0 + (100 - b.dataCompleteness) * 0.5;
    return scoreB - scoreA;
  });
}

/**
 * Computes cumulative uncertainty reduction for a subset of sampled sites.
 */
export function calculateCumulativeUncertaintyReduction(
  sites: Site[],
  budgetLimitBDT: number
): {
  sampledSites: Site[];
  totalCostBDT: number;
  expectedAvgReductionPct: number;
} {
  const ranked = rankSitesForAdaptiveSampling(sites);
  const sampledSites: Site[] = [];
  let currentCost = 0;
  let totalWeightedReduction = 0;

  for (const site of ranked) {
    if (currentCost + site.estimatedSamplingCostBDT <= budgetLimitBDT) {
      sampledSites.push(site);
      currentCost += site.estimatedSamplingCostBDT;
      totalWeightedReduction += site.expectedUncertaintyReduction;
    }
  }

  const expectedAvgReductionPct =
    sampledSites.length > 0 ? Number((totalWeightedReduction / sampledSites.length).toFixed(1)) : 0;

  return {
    sampledSites,
    totalCostBDT: currentCost,
    expectedAvgReductionPct,
  };
}
