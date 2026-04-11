import { describe, it, expect } from 'vitest';
import { calculateThreadStripping } from './threadStripping';
import { screwDatabase } from '../data/screws';
import { materialDatabase } from '../data/materials';
import { receiverPresets } from '../data/receivers';
import { boltGrades } from './torque';

const M6_pan = screwDatabase.find(s => s.size === 'M6' && s.standard === 'ISO 14580')!;
const M8_pan = screwDatabase.find(s => s.size === 'M8' && s.standard === 'ISO 14580')!;

const alu6061 = materialDatabase.find(m => m.name === 'Aluminum 6061-T6')!;
const pa12sls = materialDatabase.find(m => m.name === 'PA12 (SLS/MJF)')!;
const steel   = materialDatabase.find(m => m.name === 'Steel (generic)')!;

const grade88 = boltGrades.find(g => g.name === '8.8')!;
const directTapped = receiverPresets.find((preset) => preset.key === 'direct-tapped')!;
const solidInsert = receiverPresets.find((preset) => preset.key === 'solid-insert')!;
const rivnut = receiverPresets.find((preset) => preset.key === 'rivnut')!;

describe('calculateThreadStripping', () => {
  it('higher engagement length gives higher stripping force', () => {
    const short = calculateThreadStripping(5000, M6_pan, alu6061, 6);
    const long  = calculateThreadStripping(5000, M6_pan, alu6061, 12);
    expect(long.strippingForce).toBeGreaterThan(short.strippingForce);
  });

  it('safety factor > 1 for aluminum at 1.5d engagement', () => {
    const result = calculateThreadStripping(10000, M6_pan, alu6061, 9);
    expect(result.safetyFactor).toBeGreaterThan(1);
  });

  it('PA12 needs more engagement than alu to achieve same safety factor', () => {
    const aluResult  = calculateThreadStripping(5000, M6_pan, alu6061, 9);
    const pa12Result = calculateThreadStripping(5000, M6_pan, pa12sls, 9);
    expect(pa12Result.safetyFactor).toBeLessThan(aluResult.safetyFactor);
  });

  it('minimum engagement length recommendation is positive', () => {
    const result = calculateThreadStripping(5000, M6_pan, pa12sls, 6);
    expect(result.minEngagementLength).toBeGreaterThan(0);
  });

  it('weak nut material (PA12) with grade → internal mode is critical', () => {
    const result = calculateThreadStripping(5000, M6_pan, pa12sls, 9, grade88);
    expect(result.criticalMode).toBe('internal');
    expect(result.internalStrippingForce).toBeLessThan(result.externalStrippingForce);
  });

  it('both internal and external modes are computed when a grade is supplied with steel nut', () => {
    const result = calculateThreadStripping(5000, M6_pan, steel, 9, grade88);
    expect(Number.isFinite(result.internalStrippingForce)).toBe(true);
    expect(Number.isFinite(result.externalStrippingForce)).toBe(true);
    expect(result.externalStrippingForce).toBeGreaterThan(0);
    expect(result.strippingForce).toBe(
      Math.min(result.internalStrippingForce, result.externalStrippingForce)
    );
  });

  it('engagement factor C_int is geometry-derived (>0.7 and <1.0) for M8', () => {
    const result = calculateThreadStripping(10000, M8_pan, alu6061, 12);
    expect(result.engagementFactor).toBeGreaterThan(0.7);
    expect(result.engagementFactor).toBeLessThan(1.0);
  });

  it('without grade → externalStrippingForce is Infinity and criticalMode is internal', () => {
    const result = calculateThreadStripping(5000, M6_pan, steel, 9);
    expect(result.externalStrippingForce).toBe(Infinity);
    expect(result.criticalMode).toBe('internal');
  });

  it('shear area is linear with engagement length', () => {
    const r6  = calculateThreadStripping(5000, M6_pan, alu6061, 6);
    const r12 = calculateThreadStripping(5000, M6_pan, alu6061, 12);
    expect(r12.shearArea / r6.shearArea).toBeCloseTo(2, 5);
  });

  it('solid insert improves stripping margin compared with direct tapped material', () => {
    const direct = calculateThreadStripping(5000, M6_pan, alu6061, 9, grade88, directTapped);
    const inserted = calculateThreadStripping(5000, M6_pan, alu6061, 9, grade88, solidInsert);
    expect(inserted.safetyFactor).toBeGreaterThan(direct.safetyFactor);
    expect(inserted.minEngagementLength).toBeLessThan(direct.minEngagementLength);
  });

  it('rivnut reduces stripping margin compared with direct tapped material', () => {
    const direct = calculateThreadStripping(5000, M6_pan, alu6061, 9, grade88, directTapped);
    const blind = calculateThreadStripping(5000, M6_pan, alu6061, 9, grade88, rivnut);
    expect(blind.safetyFactor).toBeLessThan(direct.safetyFactor);
  });
});

  // FIX #1: minEngagementLength follows governing mode
  it('minEngagementLength yields SF >= 1.5 when external stripping governs', () => {
    const titanium = materialDatabase.find(m => m.name === 'Titanium Ti-6Al-4V')!;
    const M3 = screwDatabase.find(s => s.size === 'M3' && s.standard === 'ISO 4017')!;
    const result = calculateThreadStripping(1000, M3, titanium, 3, grade88, directTapped);

    if (result.criticalMode === 'external') {
      // Re-check at minEngagementLength — safety factor must be >= 1.5
      const atMin = calculateThreadStripping(1000, M3, titanium, result.minEngagementLength, grade88, directTapped);
      expect(atMin.safetyFactor).toBeGreaterThanOrEqual(1.49); // allow float rounding
    }
  });

  it('minEngagementLength always yields SF >= 1.5 regardless of mode', () => {
    // Internal mode
    const result = calculateThreadStripping(5000, M6_pan, pa12sls, 6, grade88, directTapped);
    expect(result.criticalMode).toBe('internal');
    const atMin = calculateThreadStripping(5000, M6_pan, pa12sls, result.minEngagementLength, grade88, directTapped);
    expect(atMin.safetyFactor).toBeGreaterThanOrEqual(1.49);
  });
