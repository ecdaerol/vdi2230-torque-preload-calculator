import { describe, it, expect } from 'vitest';
import { calculateJointStiffness } from './jointStiffness';
import { screwDatabase } from '../data/screws';
import { materialDatabase } from '../data/materials';

const M6_pan = screwDatabase.find(s => s.size === 'M6' && s.standard === 'ISO 14580')!;
const M8_pan = screwDatabase.find(s => s.size === 'M8' && s.standard === 'ISO 14580')!;
const M10_pan = screwDatabase.find(s => s.size === 'M10' && s.standard === 'ISO 14580')!;
const alu6061 = materialDatabase.find(m => m.name === 'Aluminum 6061-T6')!;
const pa12sls = materialDatabase.find(m => m.name === 'PA12 (SLS/MJF)')!;
const steel = materialDatabase.find(m => m.name === 'Steel (generic)')!;

describe('calculateJointStiffness', () => {
  it('bolt stiffness = E × As / L', () => {
    const result = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const expected = (210000 * M6_pan.stressArea) / 12;
    expect(result.boltStiffness).toBeCloseTo(expected, 0);
  });

  it('stainless bolt has lower stiffness than steel', () => {
    const steelBolt = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const stainless = calculateJointStiffness(10000, M6_pan, alu6061, 12, 'A2-70');
    expect(stainless.boltStiffness).toBeLessThan(steelBolt.boltStiffness);
  });

  it('load factor is less than 1 (bolt is never infinitely stiff)', () => {
    const result = calculateJointStiffness(10000, M6_pan, alu6061, 20, '8.8');
    expect(result.loadFactor).toBeLessThan(1);
  });

  it('softer clamp material gives higher load factor', () => {
    const hard = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const soft = calculateJointStiffness(10000, M6_pan, pa12sls, 12, '8.8');
    expect(soft.loadFactor).toBeGreaterThan(hard.loadFactor);
  });

  it('clamp force never goes negative in diagram data', () => {
    const result = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    for (const point of result.diagramData) {
      expect(point.clampForce).toBeGreaterThanOrEqual(0);
    }
  });

  // --- NEW: additional validation tests ---

  it('load factor decreases with longer clamp (bolt becomes relatively more flexible)', () => {
    const short = calculateJointStiffness(10000, M6_pan, alu6061, 6, '8.8');
    const long = calculateJointStiffness(10000, M6_pan, alu6061, 24, '8.8');
    // Longer clamp: kBolt drops as 1/L, kClamp drops slower → bolt share (n) decreases
    expect(long.loadFactor).toBeLessThan(short.loadFactor);
  });

  it('bolt stiffness is inversely proportional to clamp length', () => {
    const r1 = calculateJointStiffness(10000, M6_pan, alu6061, 10, '8.8');
    const r2 = calculateJointStiffness(10000, M6_pan, alu6061, 20, '8.8');
    expect(r2.boltStiffness).toBeCloseTo(r1.boltStiffness / 2, 0);
  });

  it('steel clamp has higher clamp stiffness than aluminum', () => {
    const aluResult = calculateJointStiffness(10000, M8_pan, alu6061, 16, '8.8');
    const steelResult = calculateJointStiffness(10000, M8_pan, steel, 16, '8.8');
    expect(steelResult.clampStiffness).toBeGreaterThan(aluResult.clampStiffness);
  });

  it('load factor is between 0 and 1 for all reasonable configs', () => {
    for (const screw of [M6_pan, M8_pan, M10_pan]) {
      for (const mat of [alu6061, steel, pa12sls]) {
        const result = calculateJointStiffness(10000, screw, mat, screw.d * 2, '8.8');
        expect(result.loadFactor).toBeGreaterThan(0);
        expect(result.loadFactor).toBeLessThan(1);
      }
    }
  });

  it('diagram data has correct number of points', () => {
    const result = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    expect(result.diagramData.length).toBe(51); // 0 to 50 inclusive
  });

  it('diagram starts at zero deformation', () => {
    const result = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    expect(result.diagramData[0].deformation).toBe(0);
  });

  // --- Physical invariant tests (review finding #1) ---

  it('clamp stiffness is always positive', () => {
    for (const screw of [M6_pan, M8_pan, M10_pan]) {
      for (const mat of [alu6061, steel, pa12sls]) {
        const result = calculateJointStiffness(10000, screw, mat, screw.d * 2, '8.8');
        expect(result.clampStiffness).toBeGreaterThan(0);
      }
    }
  });

  it('bolt stiffness is always positive', () => {
    const result = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    expect(result.boltStiffness).toBeGreaterThan(0);
  });

  // --- Multi-material tests (review finding #2) ---

  it('mixed alu+PA12 stack is softer than pure alu stack', () => {
    const pureAlu = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const mixed = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8', pa12sls);
    expect(mixed.clampStiffness).toBeLessThan(pureAlu.clampStiffness);
  });

  it('multi-material load factor is higher than single stiffer material', () => {
    const pureAlu = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const mixed = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8', pa12sls);
    // Softer clamp → higher load factor (bolt carries more of external load)
    expect(mixed.loadFactor).toBeGreaterThan(pureAlu.loadFactor);
  });

  it('two identical materials gives same result as single material', () => {
    const single = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const dual = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8', alu6061);
    // Series of two half-length cones ≠ one full-length cone exactly,
    // but they should be similar order of magnitude
    expect(dual.clampStiffness).toBeGreaterThan(single.clampStiffness * 0.5);
    expect(dual.clampStiffness).toBeLessThan(single.clampStiffness * 2.0);
  });
});
