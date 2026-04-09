import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';

export interface JointStiffnessResult {
  boltStiffness: number;    // N/mm
  clampStiffness: number;   // N/mm
  loadFactor: number;       // n = k_b / (k_b + k_c)
  diagramData: { deformation: number; boltForce: number; clampForce: number }[];
}

const BOLT_E_MODULUS = 210000; // MPa (steel bolt assumed)

export function calculateJointStiffness(
  preload: number,
  screw: ScrewData,
  material: MaterialData,
  clampLength: number
): JointStiffnessResult {
  // Bolt stiffness: k_b = E_bolt × A_s / L_clamp
  const kBolt = (BOLT_E_MODULUS * screw.stressArea) / clampLength;

  // Clamp stiffness (VDI 2230 simplified cone model)
  // Using substitution diameter approach
  const alpha = Math.PI / 6; // 30° pressure cone half-angle
  const dw = screw.headDiameter; // bearing diameter
  const dh = screw.holeDiameter; // hole diameter
  const DA = dw + clampLength * Math.tan(alpha);

  const Ec = material.elasticModulus * 1000; // GPa to MPa

  // VDI formula for clamp stiffness
  const numerator = (DA + dh) * (dw - dh);
  const denominator = (DA - dh) * (dw + dh);

  let kClamp: number;
  if (denominator > 0 && numerator > 0) {
    kClamp = (Ec * dw * Math.PI * Math.tan(alpha)) /
             (Math.log(numerator / denominator));
  } else {
    // Fallback simplified estimation
    kClamp = Ec * screw.d * Math.PI / 2;
  }

  const loadFactor = kBolt / (kBolt + kClamp);

  // Generate diagram data points
  const maxDeformation = (preload / kBolt) * 2.5;
  const steps = 50;
  const diagramData = [];

  for (let i = 0; i <= steps; i++) {
    const def = (i / steps) * maxDeformation;
    diagramData.push({
      deformation: Math.round(def * 1000) / 1000, // μm precision
      boltForce: Math.round(kBolt * def),
      clampForce: Math.round(preload - kClamp * (def - preload / kBolt)),
    });
  }

  return { boltStiffness: kBolt, clampStiffness: kClamp, loadFactor, diagramData };
}
