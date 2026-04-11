import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';

export interface JointStiffnessResult {
  boltStiffness: number;    // N/mm
  clampStiffness: number;   // N/mm
  loadFactor: number;       // n = k_b / (k_b + k_c)
  diagramData: { deformation: number; boltForce: number; clampForce: number }[];
}

function getBoltEModulus(gradeName: string): number {
  // Stainless steel grades (austenitic)
  if (gradeName.startsWith('A2') || gradeName.startsWith('A4')) {
    return 193000; // MPa — austenitic stainless
  }
  // Carbon steel grades (8.8, 10.9, 12.9)
  return 210000; // MPa — carbon/alloy steel
}

/**
 * VDI 2230 cone stiffness for a single material layer.
 * Formula: k = (Ec * dw * PI * tan(alpha)) / (2 * ln(numerator / denominator))
 * where numerator = (DA - dh) * (dw + dh)
 *       denominator = (DA + dh) * (dw - dh)
 */
function coneStiffness(
  Ec: number,      // MPa
  dw: number,      // bearing diameter (mm)
  dh: number,      // hole diameter (mm)
  length: number   // layer thickness (mm)
): number {
  const alpha = Math.PI / 6; // 30° half-angle
  const DA = dw + length * Math.tan(alpha);
  const numerator = (DA - dh) * (dw + dh);
  const denominator = (DA + dh) * (dw - dh);

  if (numerator > 0 && denominator > 0 && numerator / denominator > 0) {
    return (Ec * dw * Math.PI * Math.tan(alpha)) /
           (2 * Math.log(numerator / denominator));
  }
  // Fallback simplified estimation
  return Ec * dw * Math.PI / 2;
}

// FIX #3: accept actual bearing geometry instead of hardcoding screw.headDiameter
export function calculateJointStiffness(
  preload: number,
  screw: ScrewData,
  material: MaterialData,
  clampLength: number,
  gradeName: string,
  secondMaterial?: MaterialData | null,
  clampLengthSplit?: number,
  headBearingOD?: number,   // washer OD or head diameter override
  bottomBearingOD?: number  // nut bearing OD or nut washer OD override
): JointStiffnessResult {
  // Bolt stiffness: k_b = E_bolt × A_s / L_clamp
  const kBolt = (getBoltEModulus(gradeName) * screw.stressArea) / clampLength;

  // FIX #3: use actual bearing geometry if provided, fall back to screw dimensions
  const dwTop = headBearingOD ?? screw.headDiameter;
  const dwBot = bottomBearingOD ?? screw.headDiameter;
  const dh = screw.holeDiameter;

  let kClamp: number;

  if (secondMaterial && clampLengthSplit != null && clampLengthSplit >= 0 && clampLengthSplit <= clampLength) {
    const L1 = clampLengthSplit;
    const L2 = clampLength - clampLengthSplit;
    const Ec1 = material.elasticModulus * 1000; // GPa → MPa
    const Ec2 = secondMaterial.elasticModulus * 1000;

    if (L1 <= 0) {
      kClamp = coneStiffness(Ec2, dwBot, dh, clampLength);
    } else if (L2 <= 0) {
      kClamp = coneStiffness(Ec1, dwTop, dh, clampLength);
    } else {
      // Multi-layer: top cone uses head-side bearing, bottom uses nut-side
      const k1 = coneStiffness(Ec1, dwTop, dh, L1);
      const k2 = coneStiffness(Ec2, dwBot, dh, L2);
      // Series spring: 1/k = 1/k1 + 1/k2
      kClamp = (k1 * k2) / (k1 + k2);
    }
  } else {
    const Ec = material.elasticModulus * 1000; // GPa → MPa
    kClamp = coneStiffness(Ec, dwTop, dh, clampLength);
  }

  // Enforce physical invariant: stiffness must be at least 1 N/mm
  kClamp = Math.max(kClamp, 1);

  if (!isFinite(kClamp)) {
    const Ec = material.elasticModulus * 1000;
    kClamp = Math.max(Ec * screw.d * Math.PI / 2, 1);
  }

  const loadFactor = Math.max(0.001, Math.min(0.999, kBolt / (kBolt + kClamp)));

  // Generate diagram data points
  const maxDeformation = (preload / kBolt) * 2.5;
  const steps = 50;
  const diagramData = [];

  for (let i = 0; i <= steps; i++) {
    const def = (i / steps) * maxDeformation;
    diagramData.push({
      deformation: Math.round(def * 1000) / 1000, // μm precision
      boltForce: Math.round(kBolt * def),
      clampForce: Math.round(Math.max(0, preload - kClamp * (def - preload / kBolt))),
    });
  }

  return { boltStiffness: kBolt, clampStiffness: kClamp, loadFactor, diagramData };
}
