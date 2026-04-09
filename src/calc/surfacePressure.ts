import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';

export interface SurfacePressureResult {
  pressure: number;       // MPa
  limit: number;          // MPa (material yield)
  safetyFactor: number;
  bearingArea: number;    // mm²
  status: 'ok' | 'warning' | 'danger';
}

export function calculateSurfacePressure(
  preload: number,
  screw: ScrewData,
  material: MaterialData
): SurfacePressureResult {
  const bearingArea = (Math.PI / 4) * (
    Math.pow(screw.headDiameter, 2) - Math.pow(screw.holeDiameter, 2)
  );
  const pressure = preload / bearingArea;
  const limit = material.yieldStrength;
  const safetyFactor = limit / pressure;

  let status: 'ok' | 'warning' | 'danger' = 'ok';
  if (safetyFactor < 1.0) status = 'danger';
  else if (safetyFactor < 1.5) status = 'warning';

  return { pressure, limit, safetyFactor, bearingArea, status };
}
