import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';

/** Surface pressure check result for bolt head or nut bearing face. */
export interface SurfacePressureResult {
  /** Actual surface pressure under the bearing face (MPa). */
  pressure: number;
  /** Material compressive yield limit (MPa). */
  limit: number;
  /** Safety factor: limit / pressure. */
  safetyFactor: number;
  /** Annular bearing area (mm²). */
  bearingArea: number;
  /** Status: ok (SF ≥ 1.5), warning (1.0–1.5), danger (< 1.0). */
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
