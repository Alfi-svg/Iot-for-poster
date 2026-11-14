import fs from 'fs';
import path from 'path';
import {
  Site,
  Ecosystem,
  TelemetryReading,
  SoilCoreMeasurement,
  QualityFlag,
  ModelBenchmark,
  LedgerRecord,
  ActivityFeedItem,
} from '../types';

// Deterministic Pseudo Random Generator
let seed = 42;
function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function randomInRange(min: number, max: number): number {
  return Number((min + random() * (max - min)).toFixed(2));
}

function randomInt(min: number, max: number): number {
  return Math.floor(min + random() * (max - min + 1));
}

function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  // Convert to 64-char hex simulated sha256
  const hexPart1 = Math.abs(hash).toString(16).padStart(8, '0');
  const hexPart2 = Math.abs(~hash).toString(16).padStart(8, '0');
  const hexPart3 = Math.abs(hash * 31).toString(16).padStart(8, '0');
  const hexPart4 = Math.abs((hash ^ 0x5a5a5a5a) * 17).toString(16).padStart(8, '0');
  return `${hexPart1}${hexPart2}${hexPart3}${hexPart4}${hexPart2}${hexPart1}${hexPart4}${hexPart3}`.slice(0, 64);
}

// 25 Agriculture Locations
const agricultureLocations = [
  { name: 'Godagari Barind Research Plot A', division: 'Rajshahi', district: 'Rajshahi', upazila: 'Godagari', lat: 24.4682, lng: 88.3301, landType: 'Terrace Clay - Rice-Wheat' },
  { name: 'Tanore Drought-Prone Farmland', division: 'Rajshahi', district: 'Rajshahi', upazila: 'Tanore', lat: 24.5823, lng: 88.5831, landType: 'High Barind Acidic Clay' },
  { name: 'Paba Alluvial Paddy Polder', division: 'Rajshahi', district: 'Rajshahi', upazila: 'Paba', lat: 24.4219, lng: 88.6432, landType: 'Ganges Alluvium - Double Cropping' },
  { name: 'Mithapukur Maize-Paddy Cluster', division: 'Rangpur', district: 'Rangpur', upazila: 'Mithapukur', lat: 25.5789, lng: 89.2741, landType: 'Tista Meander Alluvium' },
  { name: 'Pirgachha Agro-ecological Field B', division: 'Rangpur', district: 'Rangpur', upazila: 'Pirgachha', lat: 25.7103, lng: 89.4002, landType: 'Silt Loam Floodplain' },
  { name: 'Kaunia Intensive Cropping Belt', division: 'Rangpur', district: 'Rangpur', upazila: 'Kaunia', lat: 25.7721, lng: 89.4211, landType: 'Sandy Loam Active Floodplain' },
  { name: 'Birganj Organic Wheat Trial', division: 'Rangpur', district: 'Dinajpur', upazila: 'Birganj', lat: 25.8624, lng: 88.6631, landType: 'Old Himalayan Piedmont Plain' },
  { name: 'Bochaganj Sugarcane-Rice Unit', division: 'Rangpur', district: 'Dinajpur', upazila: 'Bochaganj', lat: 25.8012, lng: 88.4619, landType: 'Piedmont Alluvium' },
  { name: 'Trishal Brahmaputra Research Grid', division: 'Mymensingh', district: 'Mymensingh', upazila: 'Trishal', lat: 24.5821, lng: 90.3921, landType: 'Old Brahmaputra Floodplain' },
  { name: 'Muktagachha Lowland Paddy Node', division: 'Mymensingh', district: 'Mymensingh', upazila: 'Muktagachha', lat: 24.7612, lng: 90.2641, landType: 'Gleysol Deep Hydromorphic Silt' },
  { name: 'Bhaluka Agroforestry Basin', division: 'Mymensingh', district: 'Mymensingh', upazila: 'Bhaluka', lat: 24.3789, lng: 90.3801, landType: 'Terrace Clay Loam' },
  { name: 'Sherpur Commercial Horticulture Grid', division: 'Rajshahi', district: 'Bogura', upazila: 'Sherpur', lat: 24.6712, lng: 89.4219, landType: 'Karatoa-Bangali Floodplain' },
  { name: 'Shibganj Potato-Paddy Experimental Zone', division: 'Rajshahi', district: 'Bogura', upazila: 'Shibganj', lat: 25.0019, lng: 89.3241, landType: 'Active Silt Floodplain' },
  { name: 'Sonatola Riverine Agriculture Site', division: 'Rajshahi', district: 'Bogura', upazila: 'Sonatola', lat: 24.9782, lng: 89.4981, landType: 'Charland Immature Alluvium' },
  { name: 'Singra Chalan Beel Wetland Margin', division: 'Rajshahi', district: 'Natore', upazila: 'Singra', lat: 24.5012, lng: 89.1432, landType: 'Deep Basin Peaty Clay' },
  { name: 'Burichang Intensive Vegetable Belt', division: 'Chattogram', district: 'Cumilla', upazila: 'Burichang', lat: 23.5519, lng: 91.1301, landType: 'Middle Meghna Floodplain' },
  { name: 'Chandina Paddy-Jute Precision Parcel', division: 'Chattogram', district: 'Cumilla', upazila: 'Chandina', lat: 23.4831, lng: 90.9812, landType: 'Meghna Alluvium Fine Silt' },
  { name: 'Keshabpur Coastal Adjacent Farmland', division: 'Khulna', district: 'Jashore', upazila: 'Keshabpur', lat: 22.9092, lng: 89.2198, landType: 'Calcareous Deltaic Silt' },
  { name: 'Jhikargachha Horticultural Node', division: 'Khulna', district: 'Jashore', upazila: 'Jhikargachha', lat: 23.1012, lng: 89.1301, landType: 'High Ganges Delta Alluvium' },
  { name: 'Sreemangal High-Organic Buffer', division: 'Sylhet', district: 'Moulvibazar', upazila: 'Sreemangal', lat: 24.3082, lng: 91.7341, landType: 'Brown Hill & Valley Organic Loam' },
  { name: 'Kapasia Forest-Farmland Interface', division: 'Dhaka', district: 'Gazipur', upazila: 'Kapasia', lat: 24.1102, lng: 90.5701, landType: 'Madhupur Tract Deep Red Clay' },
  { name: 'Narsingdi Silt Plain Station', division: 'Dhaka', district: 'Narsingdi', upazila: 'Shibpur', lat: 24.0381, lng: 90.7301, landType: 'Old Brahmaputra Alluvial Loam' },
  { name: 'Badarganj Cold-Zone Grain Unit', division: 'Rangpur', district: 'Rangpur', upazila: 'Badarganj', lat: 25.6719, lng: 89.0521, landType: 'Tista Active Sandy Silt' },
  { name: 'Kushtia Ganges Floodplain Core', division: 'Khulna', district: 'Kushtia', upazila: 'Kumarkhali', lat: 23.8619, lng: 89.2412, landType: 'Ganges Calcareous Alluvium' },
  { name: 'Panchagarh Sub-Himalayan Tea/Crop Plot', division: 'Rangpur', district: 'Panchagarh', upazila: 'Tetulia', lat: 26.4912, lng: 88.3512, landType: 'Sub-Himalayan Organic Silt' },
];

// 15 Blue Carbon Locations
const blueCarbonLocations = [
  { name: 'Chandpai Range Mangrove Core Plot A', division: 'Khulna', district: 'Bagerhat', upazila: 'Mongla', lat: 22.3512, lng: 89.6801, landType: 'Mature Sundari-Gewa Stand' },
  { name: 'Kotka Coastal Estuary & Wildlife Sanctuary', division: 'Khulna', district: 'Bagerhat', upazila: 'Sarankhola', lat: 21.8542, lng: 89.7821, landType: 'High Intertidal Mudflat & Mangrove' },
  { name: 'Sarankhola Eastern Sundarbans Transect', division: 'Khulna', district: 'Bagerhat', upazila: 'Sarankhola', lat: 22.2891, lng: 89.7912, landType: 'Tidal Creekside Avicennia Belt' },
  { name: 'Satkhira Western Mangrove Margin', division: 'Khulna', district: 'Satkhira', upazila: 'Shyamnagar', lat: 22.2012, lng: 89.1501, landType: 'High Salinity Rhizophora Fringe' },
  { name: 'Burigoalini Intertidal Monitoring Station', division: 'Khulna', district: 'Satkhira', upazila: 'Shyamnagar', lat: 22.2419, lng: 89.2312, landType: 'Brackish Mangrove Riverbank' },
  { name: 'Munshiganj Sundarbans Eco-Observatory', division: 'Khulna', district: 'Satkhira', upazila: 'Shyamnagar', lat: 22.2712, lng: 89.1981, landType: 'Polder Edge Tidal Mangrove' },
  { name: 'Dacope Polder-Mangrove Buffer Cell', division: 'Khulna', district: 'Khulna', upazila: 'Dacope', lat: 22.5719, lng: 89.5102, landType: 'Coastal Embankment Buffer Marsh' },
  { name: 'Paikgachha Shibsa Riverine Station', division: 'Khulna', district: 'Khulna', upazila: 'Paikgachha', lat: 22.5891, lng: 89.3301, landType: 'Brackish Estuarine Sediment' },
  { name: 'Mongla Pasur River Estuarine Node', division: 'Khulna', district: 'Bagerhat', upazila: 'Mongla', lat: 22.4812, lng: 89.5982, landType: 'Tidal Sediment Accretion Mud' },
  { name: 'Rampal Mangrove Afforestation Site', division: 'Khulna', district: 'Bagerhat', upazila: 'Rampal', lat: 22.5519, lng: 89.6412, landType: 'Restored Coastal Mangrove Basin' },
  { name: 'Chakaria Remnant Mangrove Mudflat', division: 'Chattogram', district: 'Cox\'s Bazar', upazila: 'Chakaria', lat: 21.7512, lng: 91.9812, landType: 'Degraded Intertidal Peaty Clay' },
  { name: 'Moheshkhali Channel Tidal Marsh', division: 'Chattogram', district: 'Cox\'s Bazar', upazila: 'Moheshkhali', lat: 21.5519, lng: 91.9542, landType: 'Channel Margin Mangrove Clump' },
  { name: 'Teknaf Naf River Estuary Transect', division: 'Chattogram', district: 'Cox\'s Bazar', upazila: 'Teknaf', lat: 20.8712, lng: 92.2981, landType: 'Saline Tidal Marine Mangrove' },
  { name: 'Kuakata Coastal Accretion Island', division: 'Barishal', district: 'Patuakhali', upazila: 'Kalapara', lat: 21.8219, lng: 90.1201, landType: 'Newly Accreted Coastal Mudflat' },
  { name: 'Char Fasson Mangrove Protective Greenbelt', division: 'Barishal', district: 'Bhola', upazila: 'Char Fasson', lat: 22.1812, lng: 90.7102, landType: 'Estuarine Island Mangrove Barrier' },
];

function generateTelemetry(
  ecosystem: Ecosystem,
  baselineStock: number,
  ciWidth: number
): TelemetryReading[] {
  const readings: TelemetryReading[] = [];
  const days = 90;
  const now = new Date('2024-11-15T12:00:00Z');

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    // Slight drift / seasonal variation
    const dayFactor = Math.sin((i / 90) * Math.PI * 2);
    const stockVariation = Number((baselineStock + dayFactor * (ciWidth * 0.35) + (random() - 0.5) * 1.5).toFixed(1));
    const lower = Number((stockVariation - ciWidth).toFixed(1));
    const upper = Number((stockVariation + ciWidth).toFixed(1));

    if (ecosystem === 'agriculture') {
      readings.push({
        timestamp: dateStr,
        estimatedStock: stockVariation,
        ciLower: lower,
        ciUpper: upper,
        soilMoisture: randomInRange(18.0, 36.5),
        soilTemp: randomInRange(22.4, 31.8),
        ph: randomInRange(5.8, 7.4),
        electricalConductivity: randomInRange(0.4, 1.6),
        ndvi: randomInRange(0.42, 0.76),
      });
    } else {
      readings.push({
        timestamp: dateStr,
        estimatedStock: stockVariation,
        ciLower: lower,
        ciUpper: upper,
        salinity: randomInRange(12.0, 26.5),
        waterLevel: randomInRange(0.3, 2.1),
        waterTemp: randomInRange(24.5, 30.8),
        redoxPotential: randomInRange(-160, -45),
      });
    }
  }
  return readings;
}

function generateSoilCores(baseDate: string, baseStock: number, isBlueCarbon: boolean): SoilCoreMeasurement[] {
  const depths = isBlueCarbon
    ? ['0-15 cm', '15-30 cm', '30-50 cm', '50-100 cm']
    : ['0-15 cm', '15-30 cm', '30-60 cm'];

  return depths.map((depth, idx) => {
    const socPercent = isBlueCarbon ? randomInRange(3.2, 8.5) : randomInRange(0.8, 2.4);
    const bulkDensity = isBlueCarbon ? randomInRange(0.85, 1.25) : randomInRange(1.25, 1.55);
    const sliceCarbon = Number(((baseStock / depths.length) * (1 - idx * 0.15) + randomInRange(-2, 2)).toFixed(1));

    return {
      id: `CORE-${idx + 1}`,
      date: baseDate,
      depthInterval: depth,
      socPercent,
      bulkDensity,
      carbonDensity: sliceCarbon,
      method: 'Dry Combustion (CHN Analyzer - Elementar)',
      labName: isBlueCarbon ? 'Khulna University Marine & Saline Soils Lab' : 'BARC Soil Chemistry Division, Dhaka',
    };
  });
}

function generateSites(): Site[] {
  const sites: Site[] = [];

  // 1. Agriculture Sites (25)
  agricultureLocations.forEach((loc, idx) => {
    const idNum = (idx + 1).toString().padStart(3, '0');
    const id = `BD-AG-${idNum}`;
    const baseStock = randomInRange(28.5, 58.2);
    const ciWidth = randomInRange(2.8, 6.4);
    const completeness = randomInRange(91.5, 99.4);
    const flagsCount = random() > 0.7 ? randomInt(1, 2) : 0;

    const flags: QualityFlag[] = [];
    if (flagsCount > 0) {
      const flagTypes: Array<QualityFlag['type']> = ['sensor_drift', 'missing_packets', 'outlier_reading'];
      const chosenType = flagTypes[randomInt(0, flagTypes.length - 1)];
      flags.push({
        id: `FLAG-AG-${idNum}-1`,
        type: chosenType,
        severity: chosenType === 'sensor_drift' ? 'warning' : 'info',
        message:
          chosenType === 'sensor_drift'
            ? 'Moisture probe variance exceeds 12% drift threshold vs neighbouring node'
            : 'Intermittent LoRa packet drop during monsoon precipitation',
        timestamp: '2024-11-12T08:30:00Z',
        resolved: false,
      });
    }

    // Determine sampling priority
    let samplingPriority: Site['samplingPriority'] = 'routine';
    let samplingStatus: Site['samplingStatus'] = 'none';
    if (ciWidth > 5.2 || flagsCount > 0) {
      samplingPriority = ciWidth > 5.8 ? 'urgent' : 'recommended';
      if (idx % 4 === 0) samplingStatus = 'pending';
      else if (idx % 7 === 0) samplingStatus = 'collected';
    }

    sites.push({
      id,
      name: loc.name,
      ecosystem: 'agriculture',
      division: loc.division,
      district: loc.district,
      upazila: loc.upazila,
      coordinates: { lat: loc.lat, lng: loc.lng },
      areaHa: randomInt(45, 320),
      landType: loc.landType,
      estimatedStock: baseStock,
      uncertaintyCI95: ciWidth,
      uncertaintyPercent: Number(((ciWidth / baseStock) * 100).toFixed(1)),
      dataCompleteness: completeness,
      qualityFlagsCount: flags.length,
      qualityFlags: flags,
      sensorNodeCount: randomInt(3, 8),
      lastTelemetryAt: '2024-11-15T06:00:00Z',
      lastLabSampleAt: '2024-04-18T00:00:00Z',
      activeModel: 'DA-UQ-v0.4b',
      mrvRecordId: `MRV-BD-2024-AG-${idNum}`,
      samplingPriority,
      samplingStatus,
      estimatedSamplingCostBDT: randomInt(9500, 16000),
      expectedUncertaintyReduction: randomInRange(28.0, 48.0),
      soilCoreHistory: generateSoilCores('2024-04-18', baseStock, false),
      recentTelemetry: generateTelemetry('agriculture', baseStock, ciWidth),
    });
  });

  // 2. Blue Carbon Sites (15)
  blueCarbonLocations.forEach((loc, idx) => {
    const idNum = (idx + 1).toString().padStart(3, '0');
    const id = `BD-BC-${idNum}`;
    const baseStock = randomInRange(142.0, 295.0);
    const ciWidth = randomInRange(14.5, 32.0);
    const completeness = randomInRange(88.0, 98.8);
    const flagsCount = random() > 0.65 ? randomInt(1, 3) : 0;

    const flags: QualityFlag[] = [];
    if (flagsCount > 0) {
      flags.push({
        id: `FLAG-BC-${idNum}-1`,
        type: 'salinity_spike',
        severity: 'warning',
        message: 'Tidal surge caused rapid salinity jump (>18 ppt in 2hr cycle)',
        timestamp: '2024-11-13T14:15:00Z',
        resolved: false,
      });
      if (flagsCount > 1) {
        flags.push({
          id: `FLAG-BC-${idNum}-2`,
          type: 'calibration_due',
          severity: 'info',
          message: 'Tidal optical probe biofilm maintenance scheduled',
          timestamp: '2024-11-14T09:00:00Z',
          resolved: false,
        });
      }
    }

    let samplingPriority: Site['samplingPriority'] = 'routine';
    let samplingStatus: Site['samplingStatus'] = 'none';
    if (ciWidth > 24.0 || flagsCount > 0) {
      samplingPriority = ciWidth > 27.5 ? 'urgent' : 'recommended';
      if (idx % 3 === 0) samplingStatus = 'pending';
      else if (idx === 1) samplingStatus = 'collected';
      else if (idx === 5) samplingStatus = 'analyzed';
    }

    sites.push({
      id,
      name: loc.name,
      ecosystem: 'blue_carbon',
      division: loc.division,
      district: loc.district,
      upazila: loc.upazila,
      coordinates: { lat: loc.lat, lng: loc.lng },
      areaHa: randomInt(120, 1850),
      landType: loc.landType,
      estimatedStock: baseStock,
      uncertaintyCI95: ciWidth,
      uncertaintyPercent: Number(((ciWidth / baseStock) * 100).toFixed(1)),
      dataCompleteness: completeness,
      qualityFlagsCount: flags.length,
      qualityFlags: flags,
      sensorNodeCount: randomInt(4, 12),
      lastTelemetryAt: '2024-11-15T05:45:00Z',
      lastLabSampleAt: '2024-03-12T00:00:00Z',
      activeModel: 'DA-UQ-v0.4b',
      mrvRecordId: `MRV-BD-2024-BC-${idNum}`,
      samplingPriority,
      samplingStatus,
      estimatedSamplingCostBDT: randomInt(18000, 32000),
      expectedUncertaintyReduction: randomInRange(32.0, 56.0),
      soilCoreHistory: generateSoilCores('2024-03-12', baseStock, true),
      recentTelemetry: generateTelemetry('blue_carbon', baseStock, ciWidth),
    });
  });

  return sites;
}

function generateLedgerRecords(sites: Site[]): LedgerRecord[] {
  const records: LedgerRecord[] = [];

  sites.forEach((site, idx) => {
    const rawHash = generateHash(`RAW_${site.id}_${site.lastTelemetryAt}`);
    const qcHash = generateHash(`QC_${rawHash}_PASSED`);
    const calibHash = generateHash(`CALIB_${site.id}_${site.lastLabSampleAt}`);
    const modelHash = generateHash(`MODEL_${site.activeModel}_${qcHash}_${calibHash}`);
    const finalHash = generateHash(`FINAL_MRV_${modelHash}_${site.estimatedStock}`);

    const hasFlags = site.qualityFlagsCount > 0;
    const reviewerStatus = hasFlags
      ? 'flagged'
      : idx % 3 === 0
      ? 'pending_review'
      : 'audited';

    const baseRecord: LedgerRecord = {
      id: site.mrvRecordId,
      siteId: site.id,
      siteName: site.name,
      district: site.district,
      ecosystem: site.ecosystem,
      version: 'v1.2',
      timestamp: '2024-11-15T06:30:00Z',
      estimatedStock: site.estimatedStock,
      uncertaintyCI95: site.uncertaintyCI95,
      modelVersion: site.activeModel,
      calibrationDate: site.lastLabSampleAt,
      dataHash: finalHash,
      previousVersionHash: generateHash(`PREV_${site.mrvRecordId}_v1.1`),
      qualityFlagsCount: site.qualityFlagsCount,
      reviewerStatus,
      provenance: {
        rawSensorIngestion: {
          packetsCount: site.sensorNodeCount * 90 * 24,
          satelliteTile: site.ecosystem === 'agriculture' ? 'SENTINEL-2_T45RXC_B04_B08' : 'LANDSAT-9_LC09_L1TP_137045',
          rawPayloadHash: rawHash,
          ingestionTimestamp: '2024-11-15T06:05:00Z',
        },
        qualityControl: {
          qcRulesEvaluated: 14,
          filteredAnomalies: site.qualityFlagsCount * 2,
          qcPassHash: qcHash,
          flagSummary: hasFlags ? `${site.qualityFlagsCount} flagged anomaly checks` : 'Zero critical sensor anomalies detected',
        },
        calibration: {
          anchorLabSampleId: site.soilCoreHistory[0]?.id || 'CORE-ANCHOR-01',
          labSocPercent: site.soilCoreHistory[0]?.socPercent || 1.8,
          bulkDensity: site.soilCoreHistory[0]?.bulkDensity || 1.35,
          calibrationOffset: site.ecosystem === 'agriculture' ? '-0.42 t C/ha baseline correction' : '+1.18 t C/ha salinity correction',
        },
        mlInference: {
          modelVersion: site.activeModel,
          featureCount: site.ecosystem === 'agriculture' ? 18 : 24,
          ensembleVariance: Number((site.uncertaintyCI95 * 0.48).toFixed(2)),
          inferenceRunId: `INFER-${site.id.replace('BD-', '')}-RUN-892`,
        },
        outputSummary: {
          estimatedStock: site.estimatedStock,
          ci95Width: site.uncertaintyCI95,
          ciLower: Number((site.estimatedStock - site.uncertaintyCI95).toFixed(1)),
          ciUpper: Number((site.estimatedStock + site.uncertaintyCI95).toFixed(1)),
          unit: 't C/ha',
        },
      },
      parametersSnapshot: {
        bulkDensityUsed: site.soilCoreHistory[0]?.bulkDensity || 1.35,
        temperatureCorrFactor: 1.04,
        moistureAdjustment: 0.98,
        satelliteNdviWeight: site.ecosystem === 'agriculture' ? 0.35 : 0.15,
      },
    };

    records.push(baseRecord);

    // Also push a previous v1.1 version for the first 10 sites for diff comparison
    if (idx < 10) {
      records.push({
        ...baseRecord,
        version: 'v1.1',
        timestamp: '2024-10-15T06:30:00Z',
        estimatedStock: Number((site.estimatedStock * 0.97).toFixed(1)),
        uncertaintyCI95: Number((site.uncertaintyCI95 * 1.15).toFixed(1)),
        dataHash: baseRecord.previousVersionHash!,
        previousVersionHash: generateHash(`PREV_${site.mrvRecordId}_v1.0`),
        reviewerStatus: 'audited',
        parametersSnapshot: {
          ...baseRecord.parametersSnapshot,
          satelliteNdviWeight: 0.25,
        },
      });
    }
  });

  return records;
}

function generateModelBenchmarks(): ModelBenchmark[] {
  return [
    {
      modelId: 'rf',
      name: 'Random Forest Baseline',
      tagline: 'Standard tree ensemble with empirical quantile intervals',
      ecosystem: 'combined',
      r2: 0.74,
      r2Display: '0.74',
      mae: 6.8,
      rmse: 9.2,
      mpiw: 16.4,
      picp: 86.4,
      crossHoldoutMae: 11.2,
      isBaseline: true,
      statusNote: 'Illustrative synthetic baseline',
    },
    {
      modelId: 'xgboost',
      name: 'XGBoost Baseline',
      tagline: 'Gradient boosted regression with heteroscedastic loss',
      ecosystem: 'combined',
      r2: 0.81,
      r2Display: '0.81',
      mae: 5.4,
      rmse: 7.6,
      mpiw: 13.8,
      picp: 89.2,
      crossHoldoutMae: 9.6,
      isBaseline: true,
      statusNote: 'Illustrative synthetic baseline',
    },
    {
      modelId: 'da_uq',
      name: 'Proposed DA-UQ Model',
      tagline: 'Domain-Adaptive Neural Architecture with Conformalized Uncertainty Quantification',
      ecosystem: 'combined',
      r2: null,
      r2Display: 'TBD', // HONESTY RULE: DA-UQ R2 MUST BE TBD
      mae: 4.1,
      rmse: 5.9,
      mpiw: 10.2,
      picp: 94.8,
      crossHoldoutMae: 5.8,
      isBaseline: false,
      statusNote: 'Under active field validation across dynamic coastal/floodplain holdouts; empirical R² withheld to prevent premature claims per honesty protocol',
    },
  ];
}

function generateActivityFeed(sites: Site[]): ActivityFeedItem[] {
  return [
    {
      id: 'ACT-01',
      timestamp: '2024-11-15T06:30:00Z',
      type: 'mrv_record_minted',
      title: 'MRV Ledger Record Minted',
      description: 'New verified audit hash committed for Chandpai Range Mangrove Core Plot A (v1.2).',
      siteId: 'BD-BC-001',
      siteName: 'Chandpai Range Mangrove Core Plot A',
      ecosystem: 'blue_carbon',
      severity: 'success',
    },
    {
      id: 'ACT-02',
      timestamp: '2024-11-14T14:20:00Z',
      type: 'telemetry_anomaly',
      title: 'Tidal Salinity Spike Detected',
      description: 'Moheshkhali Channel recorded sudden 19.4 ppt surge during astronomical spring tide.',
      siteId: 'BD-BC-012',
      siteName: 'Moheshkhali Channel Tidal Marsh',
      ecosystem: 'blue_carbon',
      severity: 'warning',
    },
    {
      id: 'ACT-03',
      timestamp: '2024-11-14T10:15:00Z',
      type: 'lab_sample_requested',
      title: 'Adaptive Lab Sampling Dispatched',
      description: 'Field soil core extraction scheduled for Singra Chalan Beel to reduce high model variance.',
      siteId: 'BD-AG-015',
      siteName: 'Singra Chalan Beel Wetland Margin',
      ecosystem: 'agriculture',
      severity: 'info',
    },
    {
      id: 'ACT-04',
      timestamp: '2024-11-13T16:45:00Z',
      type: 'calibration_updated',
      title: 'Lab CHN Calibration Integrated',
      description: 'Elementar CHN dry combustion analyzer coefficients updated from BARC Dhaka.',
      siteId: 'BD-AG-009',
      siteName: 'Trishal Brahmaputra Research Grid',
      ecosystem: 'agriculture',
      severity: 'success',
    },
    {
      id: 'ACT-05',
      timestamp: '2024-11-12T11:00:00Z',
      type: 'telemetry_anomaly',
      title: 'Moisture Probe Drift Flagged',
      description: 'Sensor Node 02 at Tanore Farmland flagged by automated QC outlier check.',
      siteId: 'BD-AG-002',
      siteName: 'Tanore Drought-Prone Farmland',
      ecosystem: 'agriculture',
      severity: 'warning',
    },
    {
      id: 'ACT-06',
      timestamp: '2024-11-11T09:30:00Z',
      type: 'model_retrained',
      title: 'DA-UQ Sub-domain Adaptation Cycle Complete',
      description: 'Domain-adaptive weights calibrated on Barind clay and Sundarban mangrove sediment subsets.',
      siteId: 'BD-AG-001',
      siteName: 'Godagari Barind Research Plot A',
      ecosystem: 'agriculture',
      severity: 'info',
    },
  ];
}

// Generate the whole dataset and write to data/seedData.json
function main() {
  const sites = generateSites();
  const ledgerRecords = generateLedgerRecords(sites);
  const modelBenchmarks = generateModelBenchmarks();
  const activityFeed = generateActivityFeed(sites);

  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    honestyNotice: 'SYNTHETIC DEMO DATA - NOT FIELD-VERIFIED. Do not use for carbon credit trading or commercial claims.',
    sites,
    ledgerRecords,
    modelBenchmarks,
    activityFeed,
  };

  const outputPath = path.join(dataDir, 'seedData.json');
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Successfully generated synthetic seed data: ${sites.length} sites (${sites.filter(s => s.ecosystem === 'agriculture').length} Agriculture, ${sites.filter(s => s.ecosystem === 'blue_carbon').length} Blue Carbon) -> ${outputPath}`);
}

main();
