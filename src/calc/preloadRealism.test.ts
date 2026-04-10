import { describe, expect, it } from 'vitest';
import { screwDatabase } from '../data/screws';
import { frictionDatabase } from '../data/friction';
import { materialDatabase } from '../data/materials';
import { calculateJointStiffness } from './jointStiffness';
import {
  combineScatter,
  calculatePreloadBandFromTorque,
  calculateEmbeddingLoss,
  calculateServicePreload,
  tighteningMethods,
} from './preloadRealism';

const M8 = screwDatabase.find((s) => s.standard === 'ISO 4762' && s.size === 'M8')!;
const quarter20 = screwDatabase.find((s) => s.standard === 'ASME B18.3' && s.size === '1/4-20')!;
const steelDry = frictionDatabase.find((f) => f.name === 'Steel on Steel' && f.condition === 'Dry')!;
const alu6061 = materialDatabase.find((m) => m.name === 'Aluminum 6061-T6')!;

describe('combineScatter', () => {
  it('combines independent scatter sources using root-sum-square', () => {
    const combined = combineScatter(0.12, 0.08);
    expect(combined).toBeCloseTo(Math.sqrt(0.12 ** 2 + 0.08 ** 2), 8);
  });
});

describe('calculatePreloadBandFromTorque', () => {
  it('returns a nominal preload band with min <= nominal <= max', () => {
    const band = calculatePreloadBandFromTorque(25, M8, steelDry, 0.15);
    expect(band.preloadMin).toBeLessThanOrEqual(band.preloadNominal);
    expect(band.preloadMax).toBeGreaterThanOrEqual(band.preloadNominal);
  });

  it('works for inch UNC screws as well as metric screws', () => {
    const band = calculatePreloadBandFromTorque(12, quarter20, steelDry, 0.15);
    expect(band.preloadNominal).toBeGreaterThan(0);
    expect(band.preloadMax).toBeGreaterThan(band.preloadMin);
  });
});

describe('calculateEmbeddingLoss', () => {
  it('returns zero loss without stiffness input', () => {
    const result = calculateEmbeddingLoss(25, null);
    expect(result.loss).toBe(0);
    expect(result.equivalentStiffness).toBe(0);
  });

  it('returns positive loss when settlement and stiffness are provided', () => {
    const stiffness = calculateJointStiffness(10000, M8, alu6061, 16, '8.8');
    const result = calculateEmbeddingLoss(20, stiffness);
    expect(result.loss).toBeGreaterThan(0);
    expect(result.equivalentStiffness).toBeGreaterThan(0);
  });
});

describe('calculateServicePreload', () => {
  it('service preload is lower than initial preload when losses are applied', () => {
    const stiffness = calculateJointStiffness(15000, M8, alu6061, 16, '8.8');
    const result = calculateServicePreload(28, M8, steelDry, 0.15, 8, 15, stiffness);
    expect(result.service.preloadNominal).toBeLessThan(result.initial.preloadNominal);
    expect(result.service.preloadMin).toBeLessThan(result.initial.preloadMin);
  });

  it('has usable tightening methods with positive scatter guidance', () => {
    expect(tighteningMethods.length).toBeGreaterThan(2);
    for (const method of tighteningMethods) {
      expect(method.processScatter).toBeGreaterThan(0);
    }
  });
});
