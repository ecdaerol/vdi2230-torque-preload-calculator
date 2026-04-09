import { describe, it, expect } from 'vitest';
import { calculateThreadStripping } from './threadStripping';
import { screwDatabase } from '../data/screws';
import { materialDatabase } from '../data/materials';

const M6_pan = screwDatabase.find(s => s.size === 'M6' && s.standard === 'ISO 14580')!;
const alu6061 = materialDatabase.find(m => m.name === 'Aluminum 6061-T6')!;
const pa12sls = materialDatabase.find(m => m.name === 'PA12 (SLS/MJF)')!;

describe('calculateThreadStripping', () => {
  it('higher engagement length gives higher stripping force', () => {
    const short = calculateThreadStripping(5000, M6_pan, alu6061, 6);
    const long = calculateThreadStripping(5000, M6_pan, alu6061, 12);
    expect(long.strippingForce).toBeGreaterThan(short.strippingForce);
  });

  it('safety factor > 1 for aluminum with 1.5d engagement', () => {
    const result = calculateThreadStripping(10000, M6_pan, alu6061, 9); // 1.5 × 6
    expect(result.safetyFactor).toBeGreaterThan(1);
  });

  it('PA12 needs more engagement than aluminum', () => {
    const aluResult = calculateThreadStripping(5000, M6_pan, alu6061, 9);
    const pa12Result = calculateThreadStripping(5000, M6_pan, pa12sls, 9);
    expect(pa12Result.safetyFactor).toBeLessThan(aluResult.safetyFactor);
  });

  it('minimum engagement length recommendation is positive', () => {
    const result = calculateThreadStripping(5000, M6_pan, pa12sls, 6);
    expect(result.minEngagementLength).toBeGreaterThan(0);
  });
});
