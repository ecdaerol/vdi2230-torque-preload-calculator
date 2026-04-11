/**
 * @packageDocumentation
 * Fastener Torque Calculator — VDI 2230 bolt sizing library.
 *
 * @example
 * ```ts
 * import { calculateTorque, boltGrades, computeResults } from '@ecdaerol/fastener-torque-calculator';
 * ```
 */

// ── Core calculations ──────────────────────────────────────────────
export {
  calculateTorque,
  calculatePreload,
  calculateBoltStress,
  calculateBoltUtilization,
  calculateTorsionalStress,
  computeDkm,
  boltGrades,
} from '../calc/torque';
export type { BoltGrade, BoltStressResult } from '../calc/torque';

export { calculateJointStiffness } from '../calc/jointStiffness';
export type { JointStiffnessResult } from '../calc/jointStiffness';

export { calculateOperatingState } from '../calc/operatingState';
export type { OperatingStateInput, OperatingStateResult } from '../calc/operatingState';

export {
  calculateServicePreload,
  calculatePreloadBandFromTorque,
  calculateEmbeddingLoss,
  applyServiceLosses,
  combineScatter,
  tighteningMethods,
} from '../calc/preloadRealism';
export type {
  TighteningMethod,
  PreloadBandResult,
  ServicePreloadResult,
} from '../calc/preloadRealism';

export { calculateSurfacePressure } from '../calc/surfacePressure';
export type { SurfacePressureResult } from '../calc/surfacePressure';

export { calculateThreadStripping } from '../calc/threadStripping';
export type { ThreadStrippingResult } from '../calc/threadStripping';

// ── Orchestration ──────────────────────────────────────────────────
export { computeResults } from '../domain/useCase/computeResults';
export type { ComputeResultsInput, ComputeResultsOutput } from '../domain/useCase/computeResults';

// ── Domain types ───────────────────────────────────────────────────
export type { AssemblyType } from "../domain/types";

// ── Data types ─────────────────────────────────────────────────────
export type { ScrewData } from '../data/screws';
export type { MaterialData } from '../data/materials';
export type { FrictionPair } from '../data/friction';
export type { WasherData } from '../data/washers';
export type { NutData } from '../data/nuts';
export type { ReceiverPreset } from '../data/receivers';

// ── Data constants ─────────────────────────────────────────────────
export { screwDatabase } from '../data/screws';
export { materialDatabase } from '../data/materials';
export { frictionDatabase } from '../data/friction';
export { washerDatabase } from '../data/washers';
export { nutDatabase } from '../data/nuts';
export { receiverPresets } from '../data/receivers';
