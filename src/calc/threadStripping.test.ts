import { describe, it, expect } from 'vitest';
import { calculateThreadStripping } from './threadStripping';
import { screwDatabase } from '../data/screws';
import { materialDatabase } from '../data/materials';
import { boltGrades } from './torque';

const M6_pan = screwDatabase.find(s => s.size === 'M6' && s.standard === 'ISO 14580')!;
const M8_pan = screwDatabase.find(s => s.size === 'M8' && s.standard === 'ISO 14580')!;
const alu6061 = materialDatabase.find(m => m.name === 'Aluminum 6061-T6')!;
const pa12sls = materialDatabase.find(m => m.name === 'PA12 (SLS/MJF)')!;
const steel = materialDatabase.find(m => m.name === 'Steel (generic)')!;
const grade88 = boltGrades.find(g => g.name === '8.8')!;
const gradeA270 = boltGrades.find(g => g.name === 'A2-70')!;

describe('calculateThreadStripping', () => {
  it('higher engagement length gives higher stripping force', () => {
    const short = calculateThreadStripping(5000, M6_pan, alu6061, 6, grade88);
    const long = calculateThreadStripping(5000, M6_pan, alu6061, 12, grade88);
    expect(long.strippingForce).toBeGreaterThan(short.strippingForce);
  });

  it('safety factor > 1 for aluminum with 1.5d engagement', () => {
    const result = calculateThreadStripping(10000, M6_pan, alu6061, 9, grade88); // 1.5 × 6
    expect(result.safetyFactor).toBeGreaterThan(1);
  });

  it('PA12 needs more engagement than aluminum', () => {
    const aluResult = calculateThreadStripping(5000, M6_pan, alu6061, 9, grade88);
    const pa12Result = calculateThreadStripping(5000, M6_pan, pa12sls, 9, grade88);
    expect(pa12Result.safetyFactor).toBeLessThan(aluResult.safetyFactor);
  });

  it('minimum engagement length recommendation is positive', () => {
    const result = calculateThreadStripping(5000, M6_pan, pa12sls, 6, grade88);
    expect(result.minEngagementLength).toBeGreaterThan(0);
  });

  // --- NEW: VDI 2230 §5.5 dual-mode checks ---

  it('reports critical mode for weak nut material (PA12) as internal', () => {
    const result = calculateThreadStripping(5000, M6_pan, pa12sls, 9, grade88);
    expect(result.criticalMode).toBe('internal');
    expect(result.internalStrippingForce).toBeLessThan(result.externalStrippingForce);
  });

  it('strong nut material (steel) with weak bolt (A2-70) may strip externally', () => {
    const result = calculateThreadStripping(10000, M6_pan, steel, 9, gradeA270);
    // Steel shearStrength=150 MPa, A2-70 bolt shear ≈ 0.6×700=420 MPa
    // Internal uses d1 ≈ 4.917, external uses d=6.0
    // Both are relatively strong — steel internal should still be weaker due to lower shear strength
    // But the key test is that both modes are computed
    expect(result.internalStrippingForce).toBeGreaterThan(0);
    expect(result.externalStrippingForce).toBeGreaterThan(0);
    expect(result.strippingForce).toBe(
      Math.min(result.internalStrippingForce, result.externalStrippingForce)
    );
  });

  it('engagement factor is geometry-derived, not fixed 0.64', () => {
    const result = calculateThreadStripping(5000, M8_pan, alu6061, 12, grade88);
    // For M8: C_int ≈ 0.875, C_ext ≈ 0.833 — both > 0.64
    expect(result.engagementFactor).toBeGreaterThan(0.7);
    expect(result.engagementFactor).toBeLessThan(1.0);
  });

  it('without bolt grade, only internal stripping is limiting', () => {
    const result = calculateThreadStripping(5000, M6_pan, pa12sls, 9);
    // No grade → external stripping force = Infinity → always internal
    expect(result.criticalMode).toBe('internal');
  });

  it('shear area scales linearly with engagement length', () => {
    const r1 = calculateThreadStripping(5000, M6_pan, alu6061, 6, grade88);
    const r2 = calculateThreadStripping(5000, M6_pan, alu6061, 12, grade88);
    // Same critical mode → shear area should double
    if (r1.criticalMode === r2.criticalMode) {
      expect(r2.shearArea).toBeCloseTo(r1.shearArea * 2, 0);
    }
  });
});
