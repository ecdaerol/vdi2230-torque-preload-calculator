import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { BoltGrade } from './torque';

export interface ThreadStrippingResult {
  internalStrippingForce: number;   // N — nut/tapped material strips
  externalStrippingForce: number;   // N — bolt thread strips (Infinity if no grade)
  criticalMode: 'internal' | 'external';
  strippingForce: number;           // N — min of internal/external
  safetyFactor: number;
  minEngagementLength: number;      // mm (for SF = 1.5)
  shearArea: number;                // mm² (internal shear area)
  engagementFactor: number;         // C_int
  status: 'ok' | 'warning' | 'danger';
}

export function calculateThreadStripping(
  preload: number,
  screw: ScrewData,
  material: MaterialData,
  engagementLength: number,
  grade?: BoltGrade
): ThreadStrippingResult {
  const { d, d2, pitch } = screw;
  const P = pitch;

  // Internal minor diameter per ISO 724
  const d1 = d - 1.0825 * P;

  // Geometry-derived engagement factors (VDI 2230 §5.5)
  const tan30 = Math.tan(Math.PI / 6); // tan(30°)
  const C_int = (P / 2 + tan30 * (d - d2)) / P;
  // External: uses minor diameter d3 ≈ d1 for the bolt side
  const d3 = screw.d3;
  const C_ext = (P / 2 + tan30 * (d2 - d3)) / P;

  // Internal stripping (nut/tapped material)
  // Shear area: π * d1 * Le * C_int
  const shearArea = Math.PI * d1 * engagementLength * Math.max(C_int, 0.01);
  const internalStrippingForce = shearArea * material.shearStrength;

  // External stripping (bolt at 0.6 * Rm)
  let externalStrippingForce: number;
  if (grade) {
    const Rm = grade.tensileStrength;
    const boltShearArea = Math.PI * d2 * engagementLength * Math.max(C_ext, 0.01);
    externalStrippingForce = boltShearArea * 0.6 * Rm;
  } else {
    externalStrippingForce = Infinity;
  }

  const strippingForce = Math.min(internalStrippingForce, externalStrippingForce);
  const criticalMode: 'internal' | 'external' =
    internalStrippingForce <= externalStrippingForce ? 'internal' : 'external';

  const safetyFactor = preload > 0 ? strippingForce / preload : Infinity;

  // Minimum engagement length for SF = 1.5 (based on internal mode)
  const minEngagementLength = (1.5 * preload) / (
    Math.PI * d1 * Math.max(C_int, 0.01) * material.shearStrength
  );

  let status: 'ok' | 'warning' | 'danger' = 'ok';
  if (safetyFactor < 1.0) status = 'danger';
  else if (safetyFactor < 1.5) status = 'warning';

  return {
    internalStrippingForce,
    externalStrippingForce,
    criticalMode,
    strippingForce,
    safetyFactor,
    minEngagementLength,
    shearArea,
    engagementFactor: C_int,
    status,
  };
}
