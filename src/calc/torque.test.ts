import { describe, it, expect } from 'vitest';
import { calculateTorque, calculatePreload, calculateBoltStress, boltGrades } from './torque';
import { screwDatabase } from '../data/screws';
import { frictionDatabase } from '../data/friction';

// Reference: M8 8.8 bolt, steel-on-steel dry (μ=0.12)
// VDI 2230 gives approximately T ≈ 22-25 Nm for F_V ≈ 20,000 N
const M8_pan = screwDatabase.find(s => s.size === 'M8' && s.standard === 'ISO 14580')!;
const steelDry = frictionDatabase.find(f => f.name === 'Steel on Steel' && f.condition === 'Dry')!;
const grade88 = boltGrades.find(g => g.name === '8.8')!;

describe('calculateTorque', () => {
  it('M8 8.8 at 20kN preload with μ=0.12 gives ~22-28 Nm', () => {
    const torque = calculateTorque(20000, M8_pan, steelDry);
    expect(torque).toBeGreaterThan(20);
    expect(torque).toBeLessThan(30);
  });

  it('zero preload gives zero torque', () => {
    expect(calculateTorque(0, M8_pan, steelDry)).toBe(0);
  });

  it('higher friction gives higher torque for same preload', () => {
    const stainlessDry = frictionDatabase.find(f => f.name === 'Stainless on Stainless' && f.condition === 'Dry')!;
    const t1 = calculateTorque(10000, M8_pan, steelDry);
    const t2 = calculateTorque(10000, M8_pan, stainlessDry);
    expect(t2).toBeGreaterThan(t1);
  });
});

describe('calculatePreload', () => {
  it('is the inverse of calculateTorque', () => {
    const preload = 15000;
    const torque = calculateTorque(preload, M8_pan, steelDry);
    const recovered = calculatePreload(torque, M8_pan, steelDry);
    expect(recovered).toBeCloseTo(preload, 0);
  });
});

describe('calculateBoltStress', () => {
  it('von Mises stress is always higher than axial stress', () => {
    const result = calculateBoltStress(20000, M8_pan, grade88, steelDry);
    expect(result.vonMisesStress).toBeGreaterThan(result.axialStress);
  });

  it('torsional stress is positive for nonzero preload', () => {
    const result = calculateBoltStress(20000, M8_pan, grade88, steelDry);
    expect(result.torsionalStress).toBeGreaterThan(0);
  });

  it('utilization is based on von Mises, not axial', () => {
    const result = calculateBoltStress(20000, M8_pan, grade88, steelDry);
    const axialUtil = (result.axialStress / result.proofStress) * 100;
    expect(result.utilization).toBeGreaterThan(axialUtil);
  });

  it('set screw has no head friction contribution to torsion', () => {
    const setScrew = screwDatabase.find(s => s.standard === 'ISO 4026' && s.size === 'M4')!;
    const torqueSetScrew = calculateTorque(5000, setScrew, steelDry);
    // Set screw torque should be lower than pan head (no head friction)
    const M4_pan = screwDatabase.find(s => s.size === 'M4' && s.standard === 'ISO 14580')!;
    const torquePan = calculateTorque(5000, M4_pan, steelDry);
    expect(torqueSetScrew).toBeLessThan(torquePan);
  });
});
