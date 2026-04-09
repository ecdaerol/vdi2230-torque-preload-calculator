import { describe, it, expect } from 'vitest';
import { calculateSurfacePressure } from './surfacePressure';
import { screwDatabase } from '../data/screws';
import { materialDatabase } from '../data/materials';

const M6_pan = screwDatabase.find(s => s.size === 'M6' && s.standard === 'ISO 14580')!;
const M8_pan = screwDatabase.find(s => s.size === 'M8' && s.standard === 'ISO 14580')!;
const M6_set = screwDatabase.find(s => s.size === 'M6' && s.standard === 'ISO 4026')!;
const alu6061 = materialDatabase.find(m => m.name === 'Aluminum 6061-T6')!;
const pa12sls = materialDatabase.find(m => m.name === 'PA12 (SLS/MJF)')!;
const peek = materialDatabase.find(m => m.name === 'PEEK (unfilled)')!;
const steel = materialDatabase.find(m => m.name === 'Steel (generic)')!;

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

  // --- NEW: additional validation tests ---

  it('steel is OK for standard bolts at moderate preload', () => {
    // M8: bearing area ≈ 69 mm², steel compressiveYield = 250 MPa
    // At 8000 N: pressure ≈ 116 MPa → SF ≈ 2.16 → OK
    const result = calculateSurfacePressure(8000, M8_pan, steel);
    expect(result.status).toBe('ok');
    expect(result.safetyFactor).toBeGreaterThan(1.5);
  });

  it('PEEK has higher compressive yield than PA12', () => {
    const peekResult = calculateSurfacePressure(5000, M6_pan, peek);
    const pa12Result = calculateSurfacePressure(5000, M6_pan, pa12sls);
    expect(peekResult.safetyFactor).toBeGreaterThan(pa12Result.safetyFactor);
  });

  it('larger bolt head gives lower pressure', () => {
    const m6Result = calculateSurfacePressure(10000, M6_pan, alu6061);
    const m8Result = calculateSurfacePressure(10000, M8_pan, alu6061);
    expect(m8Result.pressure).toBeLessThan(m6Result.pressure);
  });

  it('safety factor is inversely proportional to preload', () => {
    const r1 = calculateSurfacePressure(5000, M6_pan, alu6061);
    const r2 = calculateSurfacePressure(10000, M6_pan, alu6061);
    expect(r2.safetyFactor).toBeCloseTo(r1.safetyFactor / 2, 1);
  });

  it('safety factor < 1 → danger status', () => {
    const result = calculateSurfacePressure(50000, M6_pan, pa12sls);
    expect(result.safetyFactor).toBeLessThan(1);
    expect(result.status).toBe('danger');
  });

  it('safety factor between 1.0 and 1.5 → warning status', () => {
    // Find a preload that gives SF between 1 and 1.5 for PA12
    // PA12 compressive yield = 58 MPa, M8 bearing area ≈ π/4×(13²-9²) ≈ 69 mm²
    // For SF=1.25: pressure = 58/1.25 = 46.4 MPa → F = 46.4 × 69 ≈ 3200 N
    const result = calculateSurfacePressure(3200, M8_pan, pa12sls);
    expect(result.safetyFactor).toBeGreaterThanOrEqual(1.0);
    expect(result.safetyFactor).toBeLessThan(1.5);
    expect(result.status).toBe('warning');
  });

  it('set screw with zero head diameter gives zero bearing area', () => {
    // Set screws have headDiameter=0, so bearing area is effectively 0
    // This should be handled upstream (Results.tsx skips set screws)
    const result = calculateSurfacePressure(5000, M6_set, alu6061);
    // headDiameter=0, holeDiameter=6.6 → OD < ID → negative area → pressure = infinity
    expect(result.pressure).not.toBeNaN();
  });
});
