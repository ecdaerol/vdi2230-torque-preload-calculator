import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { BoltGrade } from './torque';

export interface ThreadStrippingResult {
  internalStrippingForce: number;   // N — nut/tapped hole thread failure
  externalStrippingForce: number;   // N — bolt thread failure
  criticalMode: 'internal' | 'external';
  strippingForce: number;           // N — minimum of internal/external
  safetyFactor: number;
  minEngagementLength: number;      // mm (for SF ≥ 1.5)
  shearArea: number;                // mm² (critical mode)
  engagementFactor: number;         // computed C factor (for transparency)
  status: 'ok' | 'warning' | 'danger';
}

/**
 * VDI 2230 §5.5 — Thread stripping engagement factors.
 *
 * For metric ISO threads (60° flank angle):
 *   C_internal = (P/2 + tan(30°) × (d − d₂)) / P   — nut thread
 *   C_external = (P/2 + tan(30°) × (d₂ − d₃)) / P  — bolt thread
 *
 * These replace the previously hardcoded 0.64 with geometry-derived values.
 */
const TAN_30 = Math.tan(Math.PI / 6); // ≈ 0.5774

function internalEngagementFactor(pitch: number, d: number, d2: number): number {
  return (pitch / 2 + TAN_30 * (d - d2)) / pitch;
}

function externalEngagementFactor(pitch: number, d2: number, d3: number): number {
  return (pitch / 2 + TAN_30 * (d2 - d3)) / pitch;
}

/**
 * Minor diameter of internal thread (nut).
 * D₁ = d − 1.0825 × P  (ISO 261 metric thread)
 */
function internalMinorDiameter(d: number, pitch: number): number {
  return d - 1.0825 * pitch;
}

/**
 * VDI 2230 §5.5 — Complete thread stripping check.
 *
 * Checks BOTH failure modes:
 * 1. Internal thread stripping (nut/tapped hole) — uses nut material shear strength
 * 2. External thread stripping (bolt) — uses bolt material shear strength (≈ 0.6 × Rm)
 *
 * Reports the critical (weaker) mode and its safety factor.
 */
export function calculateThreadStripping(
  preload: number,
  screw: ScrewData,
  material: MaterialData,
  engagementLength: number,
  grade?: BoltGrade
): ThreadStrippingResult {
  const { d, pitch, d2, d3 } = screw;

  // --- Internal thread stripping (nut/tapped hole material) ---
  const d1 = internalMinorDiameter(d, pitch);
  const C_int = internalEngagementFactor(pitch, d, d2);
  const shearAreaInternal = Math.PI * d1 * engagementLength * C_int;
  const internalStrippingForce = shearAreaInternal * material.shearStrength;

  // --- External thread stripping (bolt material) ---
  const C_ext = externalEngagementFactor(pitch, d2, d3);
  const shearAreaExternal = Math.PI * d * engagementLength * C_ext;
  // Bolt shear strength ≈ 0.6 × Rm (von Mises criterion for shear)
  const boltShearStrength = grade ? 0.6 * grade.tensileStrength : Infinity;
  const externalStrippingForce = shearAreaExternal * boltShearStrength;

  // --- Critical mode ---
  const criticalMode = internalStrippingForce <= externalStrippingForce
    ? 'internal' as const
    : 'external' as const;
  const strippingForce = Math.min(internalStrippingForce, externalStrippingForce);
  const shearArea = criticalMode === 'internal' ? shearAreaInternal : shearAreaExternal;
  const engagementFactor = criticalMode === 'internal' ? C_int : C_ext;

  const safetyFactor = preload > 0 ? strippingForce / preload : Infinity;

  // Minimum engagement length for SF = 1.5 (based on critical mode)
  const criticalShearStrength = criticalMode === 'internal'
    ? material.shearStrength
    : boltShearStrength;
  const criticalDiameter = criticalMode === 'internal' ? d1 : d;
  const criticalC = criticalMode === 'internal' ? C_int : C_ext;
  const minEngagementLength = (1.5 * preload) / (
    Math.PI * criticalDiameter * criticalC * criticalShearStrength
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
    engagementFactor,
    status,
  };
}
