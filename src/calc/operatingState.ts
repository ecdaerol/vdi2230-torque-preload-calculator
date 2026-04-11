import type { ScrewData } from '../data/screws';
import type { BoltGrade } from './torque';

/** Input parameters for operating-state analysis under external loads. */
export interface OperatingStateInput {
  /** Service preload after relaxation and embedding losses (N). */
  servicePreload: number;
  /** External axial service load (N). Positive = bolt-tensioning direction. */
  axialLoad: number;
  /** External transverse (shear) service load (N). */
  shearLoad: number;
  /** Load introduction factor n from stiffness model. */
  loadFactor: number;
  /** Friction coefficient at the clamped interface for slip checks. */
  interfaceFriction: number;
  /** Number of friction interfaces for slip resistance (≥ 1). */
  interfaceCount: number;
  /** Fastener geometry. */
  screw: ScrewData;
  /** Bolt material grade (for shear allowable). */
  grade: BoltGrade;
}

/** Results of VDI 2230 operating-state evaluation. */
export interface OperatingStateResult {
  /** Bolt's share of external axial load: n. */
  boltLoadShare: number;
  /** Clamp's share of external axial load: 1 − n. */
  clampLoadShare: number;
  /** Additional bolt force from axial load (N). */
  additionalBoltLoad: number;
  /** Reduction in clamp force due to axial load (N). */
  clampForceLoss: number;
  /** Remaining clamp force under service load (N). Zero if separated. */
  remainingClampForce: number;
  /** Axial load that would cause joint separation (N). */
  separationLoad: number;
  /** Separation safety margin: F_sep / F_axial. */
  separationMargin: number;
  /** Whether the joint is predicted to separate. */
  isSeparated: boolean;
  /** Total bolt force under operating load (N). */
  boltForceUnderAxialLoad: number;
  /** Friction-based transverse slip resistance (N). */
  availableSlipResistance: number;
  /** Slip safety factor: slip resistance / shear load. */
  slipSafetyFactor: number;
  /** Whether joint is predicted to slip. */
  willSlip: boolean;
  /** Bolt shear cross-section area at the shear plane (mm²). */
  shearArea: number;
  /** Simple shear stress in bolt (MPa). */
  shearStress: number;
  /** Shear allowable = 0.58 × Rp0.2 (MPa). */
  shearAllowable: number;
  /** Bolt shear safety factor: allowable / actual. */
  shearSafetyFactor: number;
}

/**
 * Evaluate operating state of a bolted joint under external axial and shear loads.
 *
 * Computes separation margin, slip resistance, and bolt shear per VDI 2230.
 * Uses the load introduction factor from the stiffness model to split
 * external axial load between bolt and clamp.
 *
 * @returns Full operating-state assessment
 */
export function calculateOperatingState({
  servicePreload,
  axialLoad,
  shearLoad,
  loadFactor,
  interfaceFriction,
  interfaceCount,
  screw,
  grade,
}: OperatingStateInput): OperatingStateResult {
  const boltLoadShare = Math.max(0, Math.min(1, loadFactor));
  const clampLoadShare = 1 - boltLoadShare;

  const separationLoad = clampLoadShare > 0 ? servicePreload / clampLoadShare : Number.POSITIVE_INFINITY;
  const remainingClampForce = Math.max(0, servicePreload - clampLoadShare * axialLoad);
  const isSeparated = axialLoad > 0 && remainingClampForce <= 0;
  const separationMargin = axialLoad > 0 ? separationLoad / axialLoad : Number.POSITIVE_INFINITY;

  const axialLoadBeforeSeparation = Math.min(axialLoad, separationLoad);
  const additionalBoltLoad = boltLoadShare * axialLoadBeforeSeparation + Math.max(0, axialLoad - separationLoad);
  const clampForceLoss = servicePreload - remainingClampForce;
  const boltForceUnderAxialLoad = servicePreload + additionalBoltLoad;

  // FIX #5: slip resistance scales with number of friction interfaces
  const nInterfaces = Math.max(1, interfaceCount);
  const availableSlipResistance = Math.max(0, interfaceFriction) * remainingClampForce * nInterfaces;
  const slipSafetyFactor = shearLoad > 0 ? availableSlipResistance / shearLoad : Number.POSITIVE_INFINITY;
  const willSlip = shearLoad > 0 && availableSlipResistance < shearLoad;

  // FIX #4: use minor diameter for threaded shear planes (conservative)
  // Shoulder bolts use shoulder diameter. Partially threaded bolts with explicit
  // shank can use major diameter. Fully threaded bolts must use minor diameter.
  let effectiveDiameter: number;
  if (screw.shoulderDiameter) {
    effectiveDiameter = screw.shoulderDiameter;
  } else if (screw.partiallyThreaded) {
    // Shear plane likely on unthreaded shank — use major diameter
    effectiveDiameter = screw.d;
  } else {
    // Fully threaded — shear plane is through threads, use minor diameter d3
    effectiveDiameter = screw.d3;
  }
  const shearArea = Math.PI * effectiveDiameter * effectiveDiameter / 4;
  const shearStress = shearLoad > 0 ? shearLoad / shearArea : 0;
  const shearAllowable = 0.58 * grade.Rp02;
  const shearSafetyFactor = shearStress > 0 ? shearAllowable / shearStress : Number.POSITIVE_INFINITY;

  return {
    boltLoadShare,
    clampLoadShare,
    additionalBoltLoad,
    clampForceLoss,
    remainingClampForce,
    separationLoad,
    separationMargin,
    isSeparated,
    boltForceUnderAxialLoad,
    availableSlipResistance,
    slipSafetyFactor,
    willSlip,
    shearArea,
    shearStress,
    shearAllowable,
    shearSafetyFactor,
  };
}
