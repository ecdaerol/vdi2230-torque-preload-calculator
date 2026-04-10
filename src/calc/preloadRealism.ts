import { calculatePreload } from './torque';
import type { ScrewData } from '../data/screws';
import type { FrictionPair } from '../data/friction';
import type { JointStiffnessResult } from './jointStiffness';

export interface TighteningMethod {
  key: string;
  label: string;
  processScatter: number; // fractional
  notes: string;
}

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

export interface PreloadBandResult {
  scatter: number;
  preloadMin: number;
  preloadNominal: number;
  preloadMax: number;
}

export interface ServicePreloadResult {
  initial: PreloadBandResult;
  service: PreloadBandResult;
  relaxationLoss: number;
  embeddingLoss: number;
  equivalentStiffness: number;
}

export function combineScatter(...scatters: number[]): number {
  const squared = scatters.filter((value) => value > 0).reduce((sum, value) => sum + value * value, 0);
  return Math.sqrt(squared);
}

function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

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
