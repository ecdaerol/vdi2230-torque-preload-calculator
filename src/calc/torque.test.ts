import { describe, it, expect } from 'vitest';
import {
  calculateTorque,
  calculatePreload,
  calculateBoltStress,
  boltGrades,
  type BoltGrade,
} from './torque';
import { screwDatabase } from '../data/screws';
import { frictionDatabase } from '../data/friction';

// Reference screws and friction pairs
const M8_pan  = screwDatabase.find(s => s.size === 'M8'  && s.standard === 'ISO 14580')!;
const M10_pan = screwDatabase.find(s => s.size === 'M10' && s.standard === 'ISO 14580')!;
const M4_pan  = screwDatabase.find(s => s.size === 'M4'  && s.standard === 'ISO 14580')!;
const M4_set  = screwDatabase.find(s => s.size === 'M4'  && s.standard === 'ISO 4026')!;
const M6_pan  = screwDatabase.find(s => s.size === 'M6'  && s.standard === 'ISO 14580')!;

const steelDry     = frictionDatabase.find(f => f.name === 'Steel on Steel' && f.condition === 'Dry')!;
const steelOiled   = frictionDatabase.find(f => f.name === 'Steel on Steel' && f.condition === 'Oiled')!;
const stainlessDry = frictionDatabase.find(f => f.name === 'Stainless on Stainless' && f.condition === 'Dry')!;

const grade88  = boltGrades.find(g => g.name === '8.8')!;
const grade109 = boltGrades.find(g => g.name === '10.9')!;

describe('calculateTorque', () => {
  it('M8 8.8 at 20 kN with dry steel friction gives 22-28 Nm (VDI 2230)', () => {
    const torque = calculateTorque(20000, M8_pan, steelDry);
    expect(torque).toBeGreaterThan(22);
    expect(torque).toBeLessThan(28);
  });

  it('zero preload gives zero torque', () => {
    expect(calculateTorque(0, M8_pan, steelDry)).toBe(0);
  });

  it('higher friction gives higher torque for the same preload', () => {
    // stainlessDry has muThread=0.18 vs steelDry muThread=0.12
    const tLow  = calculateTorque(10000, M8_pan, steelDry);
    const tHigh = calculateTorque(10000, M8_pan, stainlessDry);
    expect(tHigh).toBeGreaterThan(tLow);
  });

  it('M10 8.8 at 90% Rp0.2 preload is in VDI 2230 reference range 45-60 Nm', () => {
    // 90% of Rp0.2 = 0.90 * 640 MPa * 58 mm² (As for M10) = 33408 N
    const preload = 0.90 * grade88.Rp02 * M10_pan.stressArea;
    const torque = calculateTorque(preload, M10_pan, steelDry);
    expect(torque).toBeGreaterThan(45);
    expect(torque).toBeLessThan(60);
  });

  it('torque is linear with preload', () => {
    const t1 = calculateTorque(10000, M8_pan, steelDry);
    const t2 = calculateTorque(20000, M8_pan, steelDry);
    expect(t2 / t1).toBeCloseTo(2, 5);
  });

  it('oiled condition gives lower torque than dry for the same preload', () => {
    const tDry   = calculateTorque(15000, M8_pan, steelDry);
    const tOiled = calculateTorque(15000, M8_pan, steelOiled);
    expect(tOiled).toBeLessThan(tDry);
  });

  it('set screw produces lower torque than headed bolt of same size and preload (no head friction)', () => {
    const tSet     = calculateTorque(5000, M4_set, steelDry);
    const tHeaded  = calculateTorque(5000, M4_pan, steelDry);
    expect(tSet).toBeLessThan(tHeaded);
  });
});

describe('calculatePreload — inverse of calculateTorque', () => {
  it('calculatePreload ∘ calculateTorque = identity for M8', () => {
    const preload = 15000;
    const recovered = calculatePreload(calculateTorque(preload, M8_pan, steelDry), M8_pan, steelDry);
    expect(recovered).toBeCloseTo(preload, 0);
  });

  it('round-trip for M6 with oiled friction', () => {
    const preload = 8000;
    const recovered = calculatePreload(calculateTorque(preload, M6_pan, steelOiled), M6_pan, steelOiled);
    expect(recovered).toBeCloseTo(preload, 0);
  });

  it('round-trip for M10 with stainless friction', () => {
    const preload = 25000;
    const recovered = calculatePreload(calculateTorque(preload, M10_pan, stainlessDry), M10_pan, stainlessDry);
    expect(recovered).toBeCloseTo(preload, 0);
  });
});

describe('calculateBoltStress', () => {
  it('70% axial utilization gives von Mises utilization of 75-95%', () => {
    // Target 70% axial: F = 0.70 * Rp02 * As
    const preload = 0.70 * grade88.Rp02 * M8_pan.stressArea;
    const result  = calculateBoltStress(preload, M8_pan, grade88, steelDry);
    expect(result.utilization).toBeGreaterThan(75);
    expect(result.utilization).toBeLessThan(95);
  });

  it('zero preload gives zero von Mises stress and zero utilization', () => {
    const result = calculateBoltStress(0, M8_pan, grade88, steelDry);
    expect(result.vonMisesStress).toBe(0);
    expect(result.utilization).toBe(0);
  });

  it('higher grade gives lower utilization for the same preload', () => {
    const preload = 20000;
    const r88  = calculateBoltStress(preload, M8_pan, grade88,  steelDry);
    const r109 = calculateBoltStress(preload, M8_pan, grade109, steelDry);
    expect(r109.utilization).toBeLessThan(r88.utilization);
  });

  it('torsional stress is proportional to preload', () => {
    const r1 = calculateBoltStress(10000, M8_pan, grade88, steelDry);
    const r2 = calculateBoltStress(20000, M8_pan, grade88, steelDry);
    expect(r2.torsionalStress / r1.torsionalStress).toBeCloseTo(2, 5);
  });

  it('BoltGrade uses Rp02 (not proofStress) as the yield reference', () => {
    // Verify the interface shape: grade88 must have Rp02 and tensileStrength
    const g: BoltGrade = grade88;
    expect(g.Rp02).toBe(640);
    expect(g.tensileStrength).toBe(800);
    expect(Object.prototype.hasOwnProperty.call(g, 'proofStress')).toBe(false);
  });

  it('von Mises stress always exceeds axial stress when preload is non-zero', () => {
    const result = calculateBoltStress(20000, M8_pan, grade88, steelDry);
    expect(result.vonMisesStress).toBeGreaterThan(result.axialStress);
  });
});
