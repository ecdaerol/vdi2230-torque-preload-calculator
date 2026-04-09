import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';

export interface JointStiffnessResult {
  boltStiffness: number;    // N/mm
  clampStiffness: number;   // N/mm (effective, including all layers)
  loadFactor: number;       // n = k_b / (k_b + k_c)
  diagramData: { deformation: number; boltForce: number; clampForce: number }[];
}

function getBoltEModulus(gradeName: string): number {
  if (gradeName.startsWith('A2') || gradeName.startsWith('A4')) {
    return 193000; // MPa — austenitic stainless
  }
  return 210000; // MPa — carbon/alloy steel
}

/**
 * VDI 2230 §5.2.2 — single-layer cone model clamp stiffness.
 * k_c = E_c · π · d_w · tan(α) / (2 · ln( (D_A − d_h)(d_w + d_h) / ((D_A + d_h)(d_w − d_h)) ))
 */
function coneStiffness(
  Ec: number,   // MPa
  dw: number,   // bearing OD mm
  dh: number,   // hole diameter mm
  layerLength: number, // mm
): number {
  const alpha = Math.PI / 6; // 30° half-angle
  const DA = dw + layerLength * Math.tan(alpha);

  const numerator = (DA - dh) * (dw + dh);
  const denominator = (DA + dh) * (dw - dh);

  if (denominator > 0 && numerator > denominator) {
    // VDI 2230:2015 §5.2.2 — factor of 2 in denominator for substitution cone
    return (Ec * dw * Math.PI * Math.tan(alpha)) / (2 * Math.log(numerator / denominator));
  } else if (dw > dh && Ec > 0) {
    // Fallback: cylindrical model when cone geometry is degenerate
    return Ec * Math.PI * (dw * dw - dh * dh) / (4 * layerLength);
  }
  return Ec * Math.PI * dw / 2; // last resort
}

/**
 * Calculate joint stiffness with optional multi-material clamp stack.
 *
 * If a second material is provided, the clamp is modeled as two layers in series:
 *   1/k_total = 1/k_layer1 + 1/k_layer2
 * The clamp length is split evenly by default (can be overridden with clampLengthSplit).
 *
 * This addresses review finding #2: joint stiffness must consider the full stack.
 */
export function calculateJointStiffness(
  preload: number,
  screw: ScrewData,
  material: MaterialData,
  clampLength: number,
  gradeName: string,
  secondMaterial?: MaterialData,
  clampLengthSplit?: number, // fraction of clampLength for first material (0–1), default 0.5
): JointStiffnessResult {
  const kBolt = (getBoltEModulus(gradeName) * screw.stressArea) / clampLength;

  const dw = screw.headDiameter;
  const dh = screw.holeDiameter;

  let kClamp: number;
  if (secondMaterial && dw > 0) {
    // Multi-layer: series compliance
    const split = clampLengthSplit ?? 0.5;
    const L1 = clampLength * split;
    const L2 = clampLength * (1 - split);
    const Ec1 = material.elasticModulus * 1000;
    const Ec2 = secondMaterial.elasticModulus * 1000;
    const k1 = L1 > 0 ? coneStiffness(Ec1, dw, dh, L1) : Infinity;
    const k2 = L2 > 0 ? coneStiffness(Ec2, dw, dh, L2) : Infinity;
    // Series: 1/k_total = 1/k1 + 1/k2
    kClamp = 1 / (1 / k1 + 1 / k2);
  } else {
    const Ec = material.elasticModulus * 1000;
    kClamp = dw > 0
      ? coneStiffness(Ec, dw, dh, clampLength)
      : Ec * screw.d * Math.PI / 2; // set screws: rough fallback
  }

  // Physical invariant: clamp stiffness must be positive
  kClamp = Math.max(kClamp, 1);

  const loadFactor = kBolt / (kBolt + kClamp);

  // Generate diagram data points
  const maxDeformation = (preload / kBolt) * 2.5;
  const steps = 50;
  const diagramData = [];

  for (let i = 0; i <= steps; i++) {
    const def = (i / steps) * maxDeformation;
    diagramData.push({
      deformation: Math.round(def * 1000) / 1000,
      boltForce: Math.round(kBolt * def),
      clampForce: Math.round(Math.max(0, preload - kClamp * (def - preload / kBolt))),
    });
  }

  return { boltStiffness: kBolt, clampStiffness: kClamp, loadFactor, diagramData };
}
