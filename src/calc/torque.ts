import { ScrewData } from '../data/screws';
import { FrictionPair } from '../data/friction';

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
  const Dkm = (screw.headDiameter + screw.holeDiameter) / 2;
  const T = preload * (
    0.16 * screw.pitch +
    0.58 * screw.d2 * friction.muThread +
    (Dkm / 2) * friction.muHead
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
  const Dkm = (screw.headDiameter + screw.holeDiameter) / 2;
  const factor = 0.16 * screw.pitch +
    0.58 * screw.d2 * friction.muThread +
    (Dkm / 2) * friction.muHead;
  return (torque * 1000) / factor; // torque in Nm → N·mm, result in N
}

/**
 * Bolt utilization = preload / (proofStress × stressArea)
 */
export function calculateBoltUtilization(
  preload: number,
  screw: ScrewData,
  grade: BoltGrade
): number {
  const maxForce = grade.proofStress * screw.stressArea;
  return (preload / maxForce) * 100;
}
