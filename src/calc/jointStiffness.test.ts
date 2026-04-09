import { describe, it, expect } from 'vitest';
import { calculateJointStiffness } from './jointStiffness';
import { screwDatabase } from '../data/screws';
import { materialDatabase } from '../data/materials';

const M6_pan = screwDatabase.find(s => s.size === 'M6' && s.standard === 'ISO 14580')!;
const alu6061 = materialDatabase.find(m => m.name === 'Aluminum 6061-T6')!;
const pa12sls = materialDatabase.find(m => m.name === 'PA12 (SLS/MJF)')!;

describe('calculateJointStiffness', () => {
  it('bolt stiffness = E × As / L', () => {
    const result = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const expected = (210000 * M6_pan.stressArea) / 12;
    expect(result.boltStiffness).toBeCloseTo(expected, 0);
  });

  it('stainless bolt has lower stiffness than steel', () => {
    const steel = calculateJointStiffness(10000, M6_pan, alu6061, 12, '8.8');
    const stainless = calculateJointStiffness(10000, M6_pan, alu6061, 12, 'A2-70');
    expect(stainless.boltStiffness).toBeLessThan(steel.boltStiffness);
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
});
