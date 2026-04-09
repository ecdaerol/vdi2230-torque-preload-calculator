import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';

export interface SurfacePressureResult {
  pressure: number;       // MPa
  limit: number;          // MPa (material yield)
  safetyFactor: number;
  bearingArea: number;    // mm²
  status: 'ok' | 'warning' | 'danger';
}

/**
 * Calculate surface pressure under head (or washer).
 * bearingOD/bearingID override screw head/hole diameters when a washer is used.
 */
export function calculateSurfacePressure(
  preload: number,
  screw: ScrewData,
  material: MaterialData,
  bearingOD?: number,
  bearingID?: number
): SurfacePressureResult {
  const od = bearingOD ?? screw.headDiameter;
  const id = bearingID ?? screw.holeDiameter;
  const limit = material.compressiveYield;
  if (od <= id) {
    return { pressure: Infinity, limit, safetyFactor: 0, bearingArea: 0, status: 'danger' as const };
  }
  const bearingArea = (Math.PI / 4) * (od * od - id * id);
  const pressure = preload / bearingArea;
  const safetyFactor = limit / pressure;

  let status: 'ok' | 'warning' | 'danger' = 'ok';
  if (safetyFactor < 1.0) status = 'danger';
  else if (safetyFactor < 1.5) status = 'warning';

  return { pressure, limit, safetyFactor, bearingArea, status };
}
