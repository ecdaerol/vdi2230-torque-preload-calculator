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
      interfaceCount: 1,
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
      interfaceCount: 1,
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
      interfaceCount: 1,
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
      interfaceCount: 1,
    });
    expect(result.shearStress).toBeGreaterThan(0);
    expect(result.shearSafetyFactor).toBeGreaterThan(1);
  });

  // FIX #4: threaded shear plane uses minor diameter
  it('fully threaded screw uses minor diameter for shear, giving higher stress', () => {
    const fullyThreaded = screwDatabase.find(
      (s) => s.standard === 'ISO 14580' && s.size === 'M8' && !s.partiallyThreaded && !s.shoulderDiameter
    )!;
    const partiallyThreaded = screwDatabase.find(
      (s) => s.size === 'M8' && s.partiallyThreaded
    );
    const base = { servicePreload: 10000, axialLoad: 0, shearLoad: 3000, loadFactor: 0.25, interfaceFriction: 0.2, grade: grade88, interfaceCount: 1 };
    const ftResult = calculateOperatingState({ ...base, screw: fullyThreaded });
    // Fully threaded should use d3 (minor), so shear stress is higher
    expect(ftResult.shearArea).toBeLessThan(Math.PI * fullyThreaded.d * fullyThreaded.d / 4);
    expect(ftResult.shearStress).toBeGreaterThan(0);
    if (partiallyThreaded) {
      const ptResult = calculateOperatingState({ ...base, screw: partiallyThreaded });
      expect(ftResult.shearStress).toBeGreaterThan(ptResult.shearStress);
    }
  });

  // FIX #5: interface count multiplies slip resistance
  it('double-lap (interfaceCount=2) doubles slip resistance', () => {
    const single = calculateOperatingState({
      servicePreload: 10000, axialLoad: 0, shearLoad: 1000,
      loadFactor: 0.25, interfaceFriction: 0.2,
      screw: M8, grade: grade88, interfaceCount: 1,
    });
    const double = calculateOperatingState({
      servicePreload: 10000, axialLoad: 0, shearLoad: 1000,
      loadFactor: 0.25, interfaceFriction: 0.2,
      screw: M8, grade: grade88, interfaceCount: 2,
    });
    expect(double.availableSlipResistance).toBeCloseTo(single.availableSlipResistance * 2, 8);
    expect(double.slipSafetyFactor).toBeCloseTo(single.slipSafetyFactor * 2, 8);
  });
});
