import { ScrewData } from '../data/screws';
import { FrictionPair } from '../data/friction';

/**
 * VDI 2230 pitch factor: approximation of tan(pitch angle) / π ≈ p / (π × d2),
 * simplified to a constant multiplier on pitch in the torque equation.
 */
const VDI_PITCH_FACTOR = 0.16;

/**
 * VDI 2230 thread friction factor: derived from 1 / (π × cos(α/2)) where α = 60°
 * for standard metric (ISO 261) threads → 1 / (π × cos 30°) ≈ 0.577 ≈ 0.58.
 */
const VDI_THREAD_FRICTION_FACTOR = 0.58;

export interface BoltGrade {
  name: string;
  Rp02: number;          // Rp0.2 in MPa (minimum yield / 0.2% proof stress per ISO 898-1)
  tensileStrength: number; // Rm in MPa
}

export const boltGrades: BoltGrade[] = [
  { name: "8.8",   Rp02: 640,  tensileStrength: 800  },
  { name: "10.9",  Rp02: 940,  tensileStrength: 1040 },
  { name: "12.9",  Rp02: 1100, tensileStrength: 1220 },
  { name: "A2-70", Rp02: 450,  tensileStrength: 700  },
  { name: "A4-80", Rp02: 600,  tensileStrength: 800  },
];

/**
 * Compute the mean bearing diameter Dkm for friction torque calculation.
 * od defaults to headDiameter, id defaults to holeDiameter.
 * Returns 0 if od <= 0 (e.g. set screws).
 */
export function computeDkm(
  headDiameter: number,
  holeDiameter: number,
  bearingOD?: number,
  bearingID?: number
): number {
  const od = bearingOD ?? headDiameter;
  const id = bearingID ?? holeDiameter;
  if (od <= 0) return 0;
  return (od + id) / 2;
}

/**
 * VDI 2230 tightening torque
 * T = F_V × (0.16 × p + 0.58 × d2 × μₜₕ + D_km/2 × μₕ)
 */
export function calculateTorque(
  preload: number,
  screw: ScrewData,
  friction: FrictionPair,
  bearingOD?: number,  // washer OD or nut bearing diameter override
  bearingID?: number   // washer ID or hole diameter override
): number {
  const Dkm = computeDkm(screw.headDiameter, screw.holeDiameter, bearingOD, bearingID);
  const headFrictionTerm = Dkm > 0 ? (Dkm / 2) * friction.muHead : 0;
  const T = preload * (
    VDI_PITCH_FACTOR * screw.pitch +
    VDI_THREAD_FRICTION_FACTOR * screw.d2 * friction.muThread +
    headFrictionTerm
  );
  return T / 1000; // Convert N·mm to N·m
}

/**
 * Inverse: given torque, find preload
 */
export function calculatePreload(
  torque: number,
  screw: ScrewData,
  friction: FrictionPair,
  bearingOD?: number,  // washer OD or nut bearing diameter override
  bearingID?: number   // washer ID or hole diameter override
): number {
  const Dkm = computeDkm(screw.headDiameter, screw.holeDiameter, bearingOD, bearingID);
  const headFrictionTerm = Dkm > 0 ? (Dkm / 2) * friction.muHead : 0;
  const factor = VDI_PITCH_FACTOR * screw.pitch +
    VDI_THREAD_FRICTION_FACTOR * screw.d2 * friction.muThread +
    headFrictionTerm;
  return (torque * 1000) / factor; // torque in Nm → N·mm, result in N
}

export interface BoltStressResult {
  axialStress: number;      // MPa
  torsionalStress: number;  // MPa
  vonMisesStress: number;   // MPa
  Rp02: number;             // MPa
  utilization: number;      // %
}

/**
 * Torsional stress in the bolt shank during tightening (VDI 2230).
 * τ = T_thread / W_p
 *   T_thread = F_V × (VDI_THREAD_FRICTION_FACTOR × d2 × μₜₕ + VDI_PITCH_FACTOR × p)
 *   W_p      = π × d3³ / 16   (polar section modulus at minor diameter)
 */
export function calculateTorsionalStress(
  preload: number,
  screw: ScrewData,
  friction: FrictionPair
): number {
  const T_thread = preload * (
    VDI_THREAD_FRICTION_FACTOR * screw.d2 * friction.muThread +
    VDI_PITCH_FACTOR * screw.pitch
  );
  const Wp = (Math.PI * Math.pow(screw.d3, 3)) / 16;
  return T_thread / Wp;
}

/**
 * Full bolt stress breakdown per VDI 2230 — combines axial preload stress
 * with torsional stress via von Mises equivalent stress.
 */
export function calculateBoltStress(
  preload: number,
  screw: ScrewData,
  grade: BoltGrade,
  friction: FrictionPair
): BoltStressResult {
  const axialStress = preload / screw.stressArea;
  const torsionalStress = calculateTorsionalStress(preload, screw, friction);
  const vonMisesStress = Math.sqrt(
    axialStress * axialStress + 3 * torsionalStress * torsionalStress
  );
  const Rp02 = grade.Rp02;
  const utilization = (vonMisesStress / Rp02) * 100;

  return { axialStress, torsionalStress, vonMisesStress, Rp02, utilization };
}

/**
 * Convenience wrapper — returns von Mises utilization (%) per VDI 2230.
 */
export function calculateBoltUtilization(
  preload: number,
  screw: ScrewData,
  grade: BoltGrade,
  friction: FrictionPair
): number {
  return calculateBoltStress(preload, screw, grade, friction).utilization;
}
