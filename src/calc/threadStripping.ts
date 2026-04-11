import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { ReceiverPreset, receiverPresets } from '../data/receivers';
import { BoltGrade } from './torque';

/** Results of VDI 2230 thread stripping analysis. */
export interface ThreadStrippingResult {
  /** Internal (nut/tapped hole) stripping force (N). */
  internalStrippingForce: number;
  /** External (bolt thread) stripping force (N). Infinity if no grade provided. */
  externalStrippingForce: number;
  /** Which mode governs: internal or external thread stripping. */
  criticalMode: 'internal' | 'external';
  /** Governing stripping force — min of internal and external (N). */
  strippingForce: number;
  /** Safety factor against thread stripping: F_strip / F_preload. */
  safetyFactor: number;
  /** Minimum engagement length for SF ≥ 1.5, based on governing mode (mm). */
  minEngagementLength: number;
  /** Internal thread shear area (mm²). */
  shearArea: number;
  /** Internal thread engagement factor C_int. */
  engagementFactor: number;
  /** Receiver capacity factor applied to internal stripping. */
  receiverFactor: number;
  /** Human-readable label for the receiver type. */
  receiverLabel: string;
  /** Status: ok (SF ≥ 1.5), warning (1.0–1.5), danger (< 1.0). */
  status: 'ok' | 'warning' | 'danger';
}

function getDefaultReceiver(): ReceiverPreset {
  return receiverPresets[0];
}

/**
 * Calculate thread stripping safety per VDI 2230.
 *
 * Evaluates both internal (nut/tapped material) and external (bolt thread)
 * stripping and reports the governing mode. Computes minimum engagement
 * length for a safety factor of 1.5.
 *
 * @param preload - Assembly preload (N)
 * @param screw - Fastener geometry
 * @param material - Tapped-hole or nut material
 * @param engagementLength - Thread engagement depth (mm)
 * @param grade - Bolt grade (optional; enables external stripping check)
 * @param receiver - Receiver type preset (affects internal capacity factor)
 * @returns Thread stripping analysis results
 */
export function calculateThreadStripping(
  preload: number,
  screw: ScrewData,
  material: MaterialData,
  engagementLength: number,
  grade?: BoltGrade,
  receiver: ReceiverPreset = getDefaultReceiver(),
): ThreadStrippingResult {
  const { d, d2, pitch } = screw;
  const P = pitch;

  const d1 = d - 1.0825 * P;

  const tan30 = Math.tan(Math.PI / 6);
  const C_int = (P / 2 + tan30 * (d - d2)) / P;
  const d3 = screw.d3;
  const C_ext = (P / 2 + tan30 * (d2 - d3)) / P;

  const shearArea = Math.PI * d1 * engagementLength * Math.max(C_int, 0.01);
  const internalStrippingForce = shearArea * material.shearStrength * receiver.internalCapacityFactor;

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

  // FIX #1: compute minEngagementLength based on the GOVERNING mode
  const minEngagementInternal = (1.5 * preload) / (
    Math.PI * d1 * Math.max(C_int, 0.01) * material.shearStrength * receiver.internalCapacityFactor
  );

  let minEngagementExternal = 0;
  if (grade) {
    const Rm = grade.tensileStrength;
    minEngagementExternal = (1.5 * preload) / (
      Math.PI * d2 * Math.max(C_ext, 0.01) * 0.6 * Rm
    );
  }

  const minEngagementLength = criticalMode === 'external' && grade
    ? Math.max(minEngagementInternal, minEngagementExternal)
    : minEngagementInternal;

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
    receiverFactor: receiver.internalCapacityFactor,
    receiverLabel: receiver.label,
    status,
  };
}
