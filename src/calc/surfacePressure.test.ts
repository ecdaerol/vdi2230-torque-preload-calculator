import { describe, it, expect } from 'vitest';
import { calculateSurfacePressure } from './surfacePressure';
import { screwDatabase } from '../data/screws';
import { materialDatabase } from '../data/materials';

const M6_pan = screwDatabase.find(s => s.size === 'M6' && s.standard === 'ISO 14580')!;
const alu6061 = materialDatabase.find(m => m.name === 'Aluminum 6061-T6')!;
const pa12sls = materialDatabase.find(m => m.name === 'PA12 (SLS/MJF)')!;

describe('calculateSurfacePressure', () => {
  it('bearing area is correct (annular ring)', () => {
    const result = calculateSurfacePressure(10000, M6_pan, alu6061);
    const expectedArea = (Math.PI / 4) * (M6_pan.headDiameter ** 2 - M6_pan.holeDiameter ** 2);
    expect(result.bearingArea).toBeCloseTo(expectedArea, 1);
  });

  it('pressure = force / area', () => {
    const result = calculateSurfacePressure(10000, M6_pan, alu6061);
    expect(result.pressure).toBeCloseTo(10000 / result.bearingArea, 1);
  });

  it('uses compressive yield for limit', () => {
    const result = calculateSurfacePressure(10000, M6_pan, pa12sls);
    expect(result.limit).toBe(pa12sls.compressiveYield);
  });

  it('PA12 shows danger at high preload', () => {
    const result = calculateSurfacePressure(5000, M6_pan, pa12sls);
    // PA12 compressive yield ~58 MPa, M6 bearing area ~44 mm²
    // pressure ≈ 5000/44 ≈ 114 MPa >> 58 MPa → danger
    expect(result.status).toBe('danger');
  });

  it('washer OD/ID override changes bearing area', () => {
    const noWasher = calculateSurfacePressure(10000, M6_pan, alu6061);
    const withWasher = calculateSurfacePressure(10000, M6_pan, alu6061, 14, 6.6);
    expect(withWasher.bearingArea).toBeGreaterThan(noWasher.bearingArea);
    expect(withWasher.pressure).toBeLessThan(noWasher.pressure);
  });
});
