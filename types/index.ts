export type Ecosystem = 'agriculture' | 'blue_carbon';
export type EcosystemFilter = 'all' | Ecosystem;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface QualityFlag {
  id: string;
  type: 'sensor_drift' | 'missing_packets' | 'salinity_spike' | 'outlier_reading' | 'low_battery' | 'calibration_due';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface SoilCoreMeasurement {
  id: string;
  date: string;
  depthInterval: string;
  socPercent: number; // % Soil Organic Carbon
  bulkDensity: number; // g/cm3
  carbonDensity: number; // t C/ha in depth layer
  method: string;
  labName: string;
}

export interface TelemetryReading {
  timestamp: string;
  estimatedStock: number;
  ciLower: number;
  ciUpper: number;
  // Agriculture sensors
  soilMoisture?: number; // % (VWC)
  soilTemp?: number; // °C
  ph?: number; // pH units
  electricalConductivity?: number; // dS/m
  ndvi?: number; // 0-1 scale proxy
  // Blue Carbon sensors
  salinity?: number; // ppt
  waterLevel?: number; // m above datum
  waterTemp?: number; // °C
  redoxPotential?: number; // mV
}

export type SamplingPriority = 'routine' | 'recommended' | 'urgent';
export type SamplingStatus = 'none' | 'pending' | 'collected' | 'analyzed';

export interface Site {
  id: string;
  name: string;
  ecosystem: Ecosystem;
  division: string;
  district: string;
  upazila: string;
  coordinates: Coordinates;
  areaHa: number;
  landType: string;
  estimatedStock: number; // t C/ha
  uncertaintyCI95: number; // ± half-width t C/ha
  uncertaintyPercent: number; // %
  dataCompleteness: number; // %
  qualityFlagsCount: number;
  qualityFlags: QualityFlag[];
  sensorNodeCount: number;
  lastTelemetryAt: string;
  lastLabSampleAt: string;
  activeModel: string;
  mrvRecordId: string;
  samplingPriority: SamplingPriority;
  samplingStatus: SamplingStatus;
  estimatedSamplingCostBDT: number;
  expectedUncertaintyReduction: number; // %
  soilCoreHistory: SoilCoreMeasurement[];
  recentTelemetry: TelemetryReading[];
}

export interface ModelBenchmark {
  modelId: 'rf' | 'xgboost' | 'da_uq';
  name: string;
  tagline: string;
  ecosystem: 'agriculture' | 'blue_carbon' | 'combined';
  r2: number | null; // null for DA-UQ to show TBD
  r2Display: string; // 'TBD' or e.g. '0.78'
  mae: number; // t C/ha
  rmse: number; // t C/ha
  mpiw: number; // Mean Prediction Interval Width (t C/ha)
  picp: number; // % empirical coverage at 95% nominal
  crossHoldoutMae: number; // t C/ha error on unseen holdout districts
  isBaseline: boolean;
  statusNote: string;
}

export interface ProvenanceChain {
  rawSensorIngestion: {
    packetsCount: number;
    satelliteTile: string;
    rawPayloadHash: string;
    ingestionTimestamp: string;
  };
  qualityControl: {
    qcRulesEvaluated: number;
    filteredAnomalies: number;
    qcPassHash: string;
    flagSummary: string;
  };
  calibration: {
    anchorLabSampleId: string;
    labSocPercent: number;
    bulkDensity: number;
    calibrationOffset: string;
  };
  mlInference: {
    modelVersion: string;
    featureCount: number;
    ensembleVariance: number;
    inferenceRunId: string;
  };
  outputSummary: {
    estimatedStock: number;
    ci95Width: number;
    ciLower: number;
    ciUpper: number;
    unit: string;
  };
}

export type ReviewerStatus = 'audited' | 'pending_review' | 'flagged';

export interface LedgerRecord {
  id: string; // e.g. MRV-BD-2024-0012
  siteId: string;
  siteName: string;
  district: string;
  ecosystem: Ecosystem;
  version: string; // e.g. v1.2
  timestamp: string;
  estimatedStock: number;
  uncertaintyCI95: number;
  modelVersion: string;
  calibrationDate: string;
  dataHash: string; // SHA-256
  previousVersionHash?: string;
  qualityFlagsCount: number;
  reviewerStatus: ReviewerStatus;
  provenance: ProvenanceChain;
  parametersSnapshot: {
    bulkDensityUsed: number;
    temperatureCorrFactor: number;
    moistureAdjustment: number;
    satelliteNdviWeight: number;
  };
}

export interface OverviewMetrics {
  totalSites: number;
  agricultureSites: number;
  blueCarbonSites: number;
  meanEstimatedStock: number;
  meanUncertaintyCI95: number;
  meanUncertaintyPercent: number;
  flaggedSitesPercentage: number;
  pendingLabSamples: number;
  totalMonitoredAreaHa: number;
}

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  type: 'telemetry_anomaly' | 'mrv_record_minted' | 'lab_sample_requested' | 'calibration_updated' | 'model_retrained';
  title: string;
  description: string;
  siteId: string;
  siteName: string;
  ecosystem: Ecosystem;
  severity?: 'info' | 'warning' | 'critical' | 'success';
}
