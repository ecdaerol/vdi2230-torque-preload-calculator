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
  proofStress: number; // MPa
}

export const boltGrades: BoltGrade[] = [
  { name: "8.8", proofStress: 640 },
  { name: "10.9", proofStress: 940 },
  { name: "12.9", proofStress: 1100 },
  { name: "A2-70", proofStress: 450 },
  { name: "A4-80", proofStress: 600 },
];

/**
 * VDI 2230 tightening torque
 * T = F_V × (0.16 × p + 0.58 × d2 × μ_th + D_km/2 × μ_h)
 */
export function calculateTorque(
  preload: number,
  screw: ScrewData,
  friction: FrictionPair
): number {
  const headFrictionTerm = screw.headDiameter > 0
    ? ((screw.headDiameter + screw.holeDiameter) / 4) * friction.muHead
    : 0;
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
  friction: FrictionPair
): number {
  const headFrictionTerm = screw.headDiameter > 0
    ? ((screw.headDiameter + screw.holeDiameter) / 4) * friction.muHead
    : 0;
  const factor = VDI_PITCH_FACTOR * screw.pitch +
    VDI_THREAD_FRICTION_FACTOR * screw.d2 * friction.muThread +
    headFrictionTerm;
  return (torque * 1000) / factor; // torque in Nm → N·mm, result in N
}

export interface BoltStressResult {
  axialStress: number;      // MPa
  torsionalStress: number;  // MPa
  vonMisesStress: number;   // MPa
  proofStress: number;      // MPa
  utilization: number;      // %
}

/**
 * Torsional stress in the bolt shank during tightening (VDI 2230).
 * τ = T_thread / W_p
 *   T_thread = F_V × (VDI_THREAD_FRICTION_FACTOR × d2 × μ_th + VDI_PITCH_FACTOR × p)
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
  const proofStress = grade.proofStress;
  const utilization = (vonMisesStress / proofStress) * 100;

  return { axialStress, torsionalStress, vonMisesStress, proofStress, utilization };
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
