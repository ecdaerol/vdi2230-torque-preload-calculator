import { describe, it, expect } from 'vitest';
import { calculateJointStiffness } from './jointStiffness';
import { screwDatabase } from '../data/screws';
import { materialDatabase } from '../data/materials';

const M6_pan  = screwDatabase.find(s => s.size === 'M6'  && s.standard === 'ISO 14580')!;
const M8_pan  = screwDatabase.find(s => s.size === 'M8'  && s.standard === 'ISO 14580')!;
const M10_pan = screwDatabase.find(s => s.size === 'M10' && s.standard === 'ISO 14580')!;

const alu6061 = materialDatabase.find(m => m.name === 'Aluminum 6061-T6')!;
const steel   = materialDatabase.find(m => m.name === 'Steel (generic)')!;
const pa12sls = materialDatabase.find(m => m.name === 'PA12 (SLS/MJF)')!;

describe('calculateJointStiffness — bolt stiffness', () => {
  it('bolt stiffness = E_bolt × As / L for steel grade', () => {
    const result   = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const expected = (210000 * M6_pan.stressArea) / 12;
    expect(result.boltStiffness).toBeCloseTo(expected, 0);
  });

  it('stainless bolt (A2-70) has lower stiffness than carbon-steel bolt (8.8)', () => {
    const steelResult  = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const ssResult     = calculateJointStiffness(10000, M6_pan, alu6061, 12, 'A2-70');
    expect(ssResult.boltStiffness).toBeLessThan(steelResult.boltStiffness);
  });

  it('bolt stiffness is inversely proportional to clamp length', () => {
    const r12 = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const r24 = calculateJointStiffness(10000, M6_pan, alu6061, 24, '8.8');
    expect(r12.boltStiffness / r24.boltStiffness).toBeCloseTo(2, 3);
  });

  it('bolt stiffness is always positive (parametric M6/M8/M10)', () => {
    for (const screw of [M6_pan, M8_pan, M10_pan]) {
      const result = calculateJointStiffness(10000, screw, alu6061, 20, '8.8');
      expect(result.boltStiffness).toBeGreaterThan(0);
    }
  });
});

describe('calculateJointStiffness — clamp stiffness', () => {
  it('steel clamp is stiffer than aluminum clamp for same geometry', () => {
    const rAlu   = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const rSteel = calculateJointStiffness(10000, M6_pan, steel,   12, '8.8');
    expect(rSteel.clampStiffness).toBeGreaterThan(rAlu.clampStiffness);
  });

  it('clamp stiffness is always positive (parametric: M6/M8/M10 × alu/steel/PA12)', () => {
    const screws    = [M6_pan, M8_pan, M10_pan];
    const materials = [alu6061, steel, pa12sls];
    for (const screw of screws) {
      for (const mat of materials) {
        const result = calculateJointStiffness(10000, screw, mat, 20, '8.8');
        expect(result.clampStiffness).toBeGreaterThan(0);
      }
    }
  });

  it('mixed alu+PA12 is softer than pure alu (higher compliance in series)', () => {
    const rAlu   = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const rMixed = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8', pa12sls, 6);
    expect(rMixed.clampStiffness).toBeLessThan(rAlu.clampStiffness);
  });
});

describe('calculateJointStiffness — load factor', () => {
  it('load factor is between 0 and 1 for M6 / alu', () => {
    const result = calculateJointStiffness(10000, M6_pan, alu6061, 20, '8.8');
    expect(result.loadFactor).toBeGreaterThan(0);
    expect(result.loadFactor).toBeLessThan(1);
  });

  it('load factor is between 0 and 1 for all M6/M8/M10 × alu/steel/PA12 configs', () => {
    const screws    = [M6_pan, M8_pan, M10_pan];
    const materials = [alu6061, steel, pa12sls];
    for (const screw of screws) {
      for (const mat of materials) {
        const result = calculateJointStiffness(10000, screw, mat, 20, '8.8');
        expect(result.loadFactor).toBeGreaterThan(0);
        expect(result.loadFactor).toBeLessThan(1);
      }
    }
  });

  it('softer clamp material gives higher load factor (PA12 > alu)', () => {
    const rAlu  = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const rPA12 = calculateJointStiffness(10000, M6_pan, pa12sls, 12, '8.8');
    expect(rPA12.loadFactor).toBeGreaterThan(rAlu.loadFactor);
  });

  it('load factor DECREASES with longer clamp (bolt becomes relatively more flexible)', () => {
    const rShort = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const rLong  = calculateJointStiffness(10000, M6_pan, alu6061, 40, '8.8');
    expect(rLong.loadFactor).toBeLessThan(rShort.loadFactor);
  });

  it('multi-material (alu+PA12) load factor is higher than pure stiffer material (alu)', () => {
    const rAlu   = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const rMixed = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8', pa12sls, 6);
    expect(rMixed.loadFactor).toBeGreaterThan(rAlu.loadFactor);
  });

  it('two identical alu layers ≈ single alu (load factor within 0.5×-2× range)', () => {
    const rSingle = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const rDouble = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8', alu6061, 6);
    expect(rDouble.loadFactor).toBeGreaterThan(rSingle.loadFactor * 0.5);
    expect(rDouble.loadFactor).toBeLessThan(rSingle.loadFactor * 2);
  });

  it('split = 0 mm uses only the second material', () => {
    const rSecondOnly = calculateJointStiffness(10000, M6_pan, pa12sls, 12, '8.8');
    const rSplitZero = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8', pa12sls, 0);
    expect(rSplitZero.clampStiffness).toBeCloseTo(rSecondOnly.clampStiffness, 5);
  });

  it('split = clampLength uses only the first material', () => {
    const rFirstOnly = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const rSplitFull = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8', pa12sls, 12);
    expect(rSplitFull.clampStiffness).toBeCloseTo(rFirstOnly.clampStiffness, 5);
  });
});

describe('calculateJointStiffness — diagram data', () => {
  it('diagram has exactly 51 data points', () => {
    const result = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    expect(result.diagramData.length).toBe(51);
  });

  it('diagram starts at zero deformation with zero bolt force', () => {
    const result = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    expect(result.diagramData[0].deformation).toBe(0);
    expect(result.diagramData[0].boltForce).toBe(0);
  });

  it('clamp force never goes negative in the diagram', () => {
    const result = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    for (const point of result.diagramData) {
      expect(point.clampForce).toBeGreaterThanOrEqual(0);
    }
  });
});
