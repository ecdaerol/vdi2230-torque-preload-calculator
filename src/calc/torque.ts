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
  Rp02: number;    // MPa — minimum yield strength (0.2% proof stress) per ISO 898-1
  tensileStrength: number; // MPa (Rm) — needed for thread stripping check
}

export const boltGrades: BoltGrade[] = [
  { name: "8.8", Rp02: 640, tensileStrength: 800 },
  { name: "10.9", Rp02: 940, tensileStrength: 1040 },
  { name: "12.9", Rp02: 1100, tensileStrength: 1220 },
  { name: "A2-70", Rp02: 450, tensileStrength: 700 },
  { name: "A4-80", Rp02: 600, tensileStrength: 800 },
];

/**
 * Compute D_km (mean bearing diameter) for the tightening side.
 *
 * When a washer or nut is the bearing surface, its OD/ID should be passed
 * instead of the default screw head geometry. For set screws (headDiameter=0)
 * the bearing friction term is zero.
 */
function computeDkm(screw: ScrewData, bearingOD?: number, bearingID?: number): number {
  const od = bearingOD ?? screw.headDiameter;
  const id = bearingID ?? screw.holeDiameter;
  if (od <= 0) return 0; // set screws: no bearing friction
  return (od + id) / 2;
}

/**
 * VDI 2230 tightening torque
 * T = F_V × (0.16 × p + 0.58 × d2 × μ_th + D_km/2 × μ_h)
 *
 * bearingOD/bearingID: optional overrides for the tightening-side bearing surface
 * (e.g. washer OD/ID or nut bearing diameter). Defaults to screw head geometry.
 */
export function calculateTorque(
  preload: number,
  screw: ScrewData,
  friction: FrictionPair,
  bearingOD?: number,
  bearingID?: number
): number {
  const Dkm = computeDkm(screw, bearingOD, bearingID);
  const T = preload * (
    VDI_PITCH_FACTOR * screw.pitch +
    VDI_THREAD_FRICTION_FACTOR * screw.d2 * friction.muThread +
    (Dkm / 2) * friction.muHead
  );
  return T / 1000; // Convert N·mm to N·m
}

/**
 * Inverse: given torque, find preload.
 * bearingOD/bearingID must match what was used for the forward calculation.
 */
export function calculatePreload(
  torque: number,
  screw: ScrewData,
  friction: FrictionPair,
  bearingOD?: number,
  bearingID?: number
): number {
  const Dkm = computeDkm(screw, bearingOD, bearingID);
  const factor = VDI_PITCH_FACTOR * screw.pitch +
    VDI_THREAD_FRICTION_FACTOR * screw.d2 * friction.muThread +
    (Dkm / 2) * friction.muHead;
  return (torque * 1000) / factor; // torque in Nm → N·mm, result in N
}

export interface BoltStressResult {
  axialStress: number;      // MPa
  torsionalStress: number;  // MPa
  vonMisesStress: number;   // MPa
  Rp02: number;      // MPa
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
