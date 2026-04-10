import { describe, it, expect } from 'vitest';
import { calculateSurfacePressure } from './surfacePressure';
import { screwDatabase } from '../data/screws';
import { materialDatabase } from '../data/materials';

const M6_pan = screwDatabase.find(s => s.size === 'M6' && s.standard === 'ISO 14580')!;
const M6_set = screwDatabase.find(s => s.size === 'M6' && s.standard === 'ISO 4026')!;
const alu6061 = materialDatabase.find(m => m.name === 'Aluminum 6061-T6')!;
const pa12sls = materialDatabase.find(m => m.name === 'PA12 (SLS/MJF)')!;

describe('calculateSurfacePressure', () => {
  it('bearing area is the correct annular ring area', () => {
    const result       = calculateSurfacePressure(10000, M6_pan, alu6061);
    const expectedArea = (Math.PI / 4) * (M6_pan.headDiameter ** 2 - M6_pan.holeDiameter ** 2);
    expect(result.bearingArea).toBeCloseTo(expectedArea, 1);
  });

  it('pressure = force / bearing area', () => {
    const result = calculateSurfacePressure(10000, M6_pan, alu6061);
    expect(result.pressure).toBeCloseTo(10000 / result.bearingArea, 1);
  });

  it('uses compressive yield as the pressure limit', () => {
    const result = calculateSurfacePressure(10000, M6_pan, pa12sls);
    expect(result.limit).toBe(pa12sls.compressiveYield);
  });

  it('PA12 shows danger status at high preload', () => {
    // PA12 compressiveYield ≈ 58 MPa; M6 bearing area ≈ 44 mm²
    // pressure ≈ 5000/44 ≈ 114 MPa >> 58 MPa → danger
    const result = calculateSurfacePressure(5000, M6_pan, pa12sls);
    expect(result.status).toBe('danger');
  });

  it('washer OD/ID override increases bearing area and reduces pressure', () => {
    const noWasher   = calculateSurfacePressure(10000, M6_pan, alu6061);
    const withWasher = calculateSurfacePressure(10000, M6_pan, alu6061, 14, 6.6);
    expect(withWasher.bearingArea).toBeGreaterThan(noWasher.bearingArea);
    expect(withWasher.pressure).toBeLessThan(noWasher.pressure);
  });

  it('set screw guard: bearingArea = 0 and status = danger when headDiameter = 0', () => {
    // Set screws have headDiameter = 0 → od <= id → immediate guard
    const result = calculateSurfacePressure(5000, M6_set, alu6061);
    expect(result.bearingArea).toBe(0);
    expect(result.status).toBe('danger');
  });

  it('safety factor = limit / pressure', () => {
    const result = calculateSurfacePressure(2000, M6_pan, alu6061);
    expect(result.safetyFactor).toBeCloseTo(result.limit / result.pressure, 5);
  });

  it('alu shows ok status at modest preload', () => {
    // alu compressiveYield = 276 MPa; M6 area ≈ 44 mm²; 1000 N → ~23 MPa << 276
    const result = calculateSurfacePressure(1000, M6_pan, alu6061);
    expect(result.status).toBe('ok');
  });
});
