import { calculatePreload } from './torque';
import type { ScrewData } from '../data/screws';
import type { FrictionPair } from '../data/friction';
import type { JointStiffnessResult } from './jointStiffness';

/** Tightening method definition with associated process scatter. */
export interface TighteningMethod {
  /** Unique key identifier. */
  key: string;
  /** Human-readable label. */
  label: string;
  /** Process scatter as a fraction (e.g. 0.12 = ±12%). */
  processScatter: number;
  /** Descriptive notes about the method. */
  notes: string;
}

/** Available tightening methods ordered from least to most precise. */
export const tighteningMethods: TighteningMethod[] = [
  {
    key: 'hand-torque',
    label: 'Torque control — hand assembly',
    processScatter: 0.12,
    notes: 'Typical manual torque-driver or hand torque wrench process.',
  },
  {
    key: 'calibrated-torque',
    label: 'Torque control — calibrated production tool',
    processScatter: 0.08,
    notes: 'Production tightening with calibrated tools and stable practice.',
  },
  {
    key: 'torque-angle',
    label: 'Torque + angle tightening',
    processScatter: 0.06,
    notes: 'Improved repeatability after snug seating.',
  },
  {
    key: 'yield-controlled',
    label: 'Yield-controlled / high-control tightening',
    processScatter: 0.05,
    notes: 'Tightly controlled process, usually for engineered joints.',
  },
];

/** Preload band showing nominal value and scatter-driven min/max. */
export interface PreloadBandResult {
  /** Combined scatter fraction used to compute the band. */
  scatter: number;
  /** Minimum preload at upper friction bound (N). */
  preloadMin: number;
  /** Nominal preload at stated friction (N). */
  preloadNominal: number;
  /** Maximum preload at lower friction bound (N). */
  preloadMax: number;
}

/** Service preload after relaxation and embedding losses. */
export interface ServicePreloadResult {
  /** Initial preload band (before losses). */
  initial: PreloadBandResult;
  /** Service preload band (after losses). */
  service: PreloadBandResult;
  /** Preload lost to relaxation (N). */
  relaxationLoss: number;
  /** Preload lost to surface embedding/settlement (N). */
  embeddingLoss: number;
  /** Equivalent series stiffness used for embedding loss (N/mm). */
  equivalentStiffness: number;
}

/**
 * Root-sum-square combination of independent scatter sources.
 * @param scatters - Individual scatter fractions (e.g. 0.12, 0.08)
 * @returns Combined scatter fraction
 */
export function combineScatter(...scatters: number[]): number {
  const squared = scatters.filter((value) => value > 0).reduce((sum, value) => sum + value * value, 0);
  return Math.sqrt(squared);
}

function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

/**
 * Compute the preload band (min/nominal/max) from a target torque value.
 *
 * Varies friction coefficients by ±scatter to find the preload extremes
 * that result from the same applied torque under friction uncertainty.
 *
 * @param torque - Target tightening torque (N·m)
 * @param screw - Fastener geometry
 * @param friction - Nominal friction pair
 * @param totalScatter - Combined scatter fraction
 * @param bearingOD - Bearing surface OD override (mm)
 * @param bearingID - Bearing surface ID override (mm)
 * @returns Preload band with scatter-driven min and max
 */
export function calculatePreloadBandFromTorque(
  torque: number,
  screw: ScrewData,
  friction: FrictionPair,
  totalScatter: number,
  bearingOD?: number,
  bearingID?: number,
): PreloadBandResult {
  const boundedScatter = Math.max(0, totalScatter);
  const nominal = calculatePreload(torque, screw, friction, bearingOD, bearingID);
  const lowFriction = {
    ...friction,
    muThread: Math.max(0.01, friction.muThread * (1 - boundedScatter)),
    muHead: Math.max(0.01, friction.muHead * (1 - boundedScatter)),
  };
  const highFriction = {
    ...friction,
    muThread: friction.muThread * (1 + boundedScatter),
    muHead: friction.muHead * (1 + boundedScatter),
  };

  const preloadMax = calculatePreload(torque, screw, lowFriction, bearingOD, bearingID);
  const preloadMin = calculatePreload(torque, screw, highFriction, bearingOD, bearingID);

  return {
    scatter: boundedScatter,
    preloadMin: Math.min(preloadMin, preloadMax),
    preloadNominal: nominal,
    preloadMax: Math.max(preloadMin, preloadMax),
  };
}

/**
 * Calculate preload loss due to surface embedding/settlement.
 *
 * Uses the equivalent series stiffness of bolt and clamp to convert
 * a settlement distance (μm) into a force loss (N).
 *
 * @param settlementMicrons - Expected surface settlement (μm)
 * @param stiffness - Joint stiffness result (optional; returns 0 loss without it)
 * @returns Embedding loss (N) and equivalent stiffness used
 */
export function calculateEmbeddingLoss(settlementMicrons: number, stiffness?: JointStiffnessResult | null): { loss: number; equivalentStiffness: number } {
  if (!stiffness || settlementMicrons <= 0) {
    return { loss: 0, equivalentStiffness: 0 };
  }
  const equivalentStiffness = (stiffness.boltStiffness * stiffness.clampStiffness) / (stiffness.boltStiffness + stiffness.clampStiffness);
  const settlementMm = settlementMicrons / 1000;
  return {
    equivalentStiffness,
    loss: equivalentStiffness * settlementMm,
  };
}

/**
 * Apply relaxation and embedding losses to a preload band.
 *
 * @param band - Initial preload band
 * @param relaxationPercent - Relaxation loss as percentage (e.g. 5 = 5%)
 * @param embeddingLoss - Embedding loss in N
 * @returns Service preload result with initial and service bands
 */
export function applyServiceLosses(band: PreloadBandResult, relaxationPercent: number, embeddingLoss: number): ServicePreloadResult {
  const relaxationFactor = Math.max(0, 1 - relaxationPercent / 100);
  const apply = (value: number) => clampNonNegative(value * relaxationFactor - embeddingLoss);
  return {
    initial: band,
    service: {
      scatter: band.scatter,
      preloadMin: apply(band.preloadMin),
      preloadNominal: apply(band.preloadNominal),
      preloadMax: apply(band.preloadMax),
    },
    relaxationLoss: clampNonNegative(band.preloadNominal * (1 - relaxationFactor)),
    embeddingLoss: clampNonNegative(embeddingLoss),
    equivalentStiffness: 0,
  };
}

/**
 * Full service preload calculation: torque → preload band → apply losses.
 *
 * Combines scatter analysis, relaxation, and embedding into a single call.
 *
 * @param torque - Target tightening torque (N·m)
 * @param screw - Fastener geometry
 * @param friction - Friction pair
 * @param totalScatter - Combined scatter fraction
 * @param relaxationPercent - Relaxation loss percentage
 * @param settlementMicrons - Surface settlement (μm)
 * @param stiffness - Joint stiffness (optional; needed for embedding loss)
 * @param bearingOD - Bearing surface OD override (mm)
 * @param bearingID - Bearing surface ID override (mm)
 * @returns Complete service preload result
 */
export function calculateServicePreload(
  torque: number,
  screw: ScrewData,
  friction: FrictionPair,
  totalScatter: number,
  relaxationPercent: number,
  settlementMicrons: number,
  stiffness?: JointStiffnessResult | null,
  bearingOD?: number,
  bearingID?: number,
): ServicePreloadResult {
  const band = calculatePreloadBandFromTorque(torque, screw, friction, totalScatter, bearingOD, bearingID);
  const { loss: embeddingLoss, equivalentStiffness } = calculateEmbeddingLoss(settlementMicrons, stiffness);
  const result = applyServiceLosses(band, relaxationPercent, embeddingLoss);
  return {
    ...result,
    equivalentStiffness,
  };
}
