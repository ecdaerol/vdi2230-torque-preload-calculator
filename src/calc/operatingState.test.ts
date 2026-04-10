import { describe, expect, it } from 'vitest';
import { calculateOperatingState } from './operatingState';
import { screwDatabase } from '../data/screws';
import { boltGrades } from './torque';

const M8 = screwDatabase.find((s) => s.standard === 'ISO 4762' && s.size === 'M8')!;
const grade88 = boltGrades.find((g) => g.name === '8.8')!;

describe('calculateOperatingState', () => {
  it('reduces clamp force by the clamp-load share of axial load before separation', () => {
    const result = calculateOperatingState({
      servicePreload: 12000,
      axialLoad: 3000,
      shearLoad: 0,
      loadFactor: 0.25,
      interfaceFriction: 0.15,
      screw: M8,
      grade: grade88,
    });
    expect(result.remainingClampForce).toBeCloseTo(12000 - 0.75 * 3000, 8);
    expect(result.additionalBoltLoad).toBeCloseTo(0.25 * 3000, 8);
  });

  it('flags separation when axial load exceeds the separation load', () => {
    const result = calculateOperatingState({
      servicePreload: 5000,
      axialLoad: 8000,
      shearLoad: 0,
      loadFactor: 0.2,
      interfaceFriction: 0.15,
      screw: M8,
      grade: grade88,
    });
    expect(result.isSeparated).toBe(true);
    expect(result.remainingClampForce).toBe(0);
  });

  it('computes slip safety factor from remaining clamp force and interface friction', () => {
    const result = calculateOperatingState({
      servicePreload: 10000,
      axialLoad: 0,
      shearLoad: 1000,
      loadFactor: 0.25,
      interfaceFriction: 0.2,
      screw: M8,
      grade: grade88,
    });
    expect(result.availableSlipResistance).toBeCloseTo(2000, 8);
    expect(result.slipSafetyFactor).toBeCloseTo(2, 8);
    expect(result.willSlip).toBe(false);
  });

  it('reports simple fastener shear stress when shear load is applied', () => {
    const result = calculateOperatingState({
      servicePreload: 10000,
      axialLoad: 0,
      shearLoad: 3000,
      loadFactor: 0.25,
      interfaceFriction: 0.2,
      screw: M8,
      grade: grade88,
    });
    expect(result.shearStress).toBeGreaterThan(0);
    expect(result.shearSafetyFactor).toBeGreaterThan(1);
  });
});
