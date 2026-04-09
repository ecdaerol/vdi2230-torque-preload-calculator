import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';

export interface ThreadStrippingResult {
  strippingForce: number;      // N
  safetyFactor: number;
  minEngagementLength: number; // mm (for SF=1.5)
  shearArea: number;           // mm²
  status: 'ok' | 'warning' | 'danger';
}

const THREAD_ENGAGEMENT_FACTOR = 0.64;

export function calculateThreadStripping(
  preload: number,
  screw: ScrewData,
  material: MaterialData,
  engagementLength: number
): ThreadStrippingResult {
  // Shear area of internal thread
  const shearArea = Math.PI * screw.d3 * engagementLength * THREAD_ENGAGEMENT_FACTOR;
  const strippingForce = shearArea * material.shearStrength;
  const safetyFactor = strippingForce / preload;

  // Minimum engagement length for SF = 1.5
  const minEngagementLength = (1.5 * preload) / (
    Math.PI * screw.d3 * THREAD_ENGAGEMENT_FACTOR * material.shearStrength
  );

  let status: 'ok' | 'warning' | 'danger' = 'ok';
  if (safetyFactor < 1.0) status = 'danger';
  else if (safetyFactor < 1.5) status = 'warning';

  return { strippingForce, safetyFactor, minEngagementLength, shearArea, status };
}
