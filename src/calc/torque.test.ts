import { describe, it, expect } from 'vitest';
import { calculateTorque, calculatePreload, calculateBoltStress, calculateTorsionalStress, boltGrades } from './torque';
import { screwDatabase } from '../data/screws';
import { frictionDatabase } from '../data/friction';

// Reference: M8 8.8 bolt, steel-on-steel dry (μ=0.12)
// VDI 2230 gives approximately T ≈ 22-25 Nm for F_V ≈ 20,000 N
const M8_pan = screwDatabase.find(s => s.size === 'M8' && s.standard === 'ISO 14580')!;
const M10_pan = screwDatabase.find(s => s.size === 'M10' && s.standard === 'ISO 14580')!;
const M6_pan = screwDatabase.find(s => s.size === 'M6' && s.standard === 'ISO 14580')!;
const M3_pan = screwDatabase.find(s => s.size === 'M3' && s.standard === 'ISO 14580')!;
const steelDry = frictionDatabase.find(f => f.name === 'Steel on Steel' && f.condition === 'Dry')!;
const steelOiled = frictionDatabase.find(f => f.name === 'Steel on Steel' && f.condition === 'Oiled')!;
const grade88 = boltGrades.find(g => g.name === '8.8')!;
const grade109 = boltGrades.find(g => g.name === '10.9')!;
const gradeA270 = boltGrades.find(g => g.name === 'A2-70')!;

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

  // --- VDI 2230 Reference: M10 8.8, μ=0.12 ---
  // At 90% proof load: F_V = 0.9 × 640 × 58.0 = 33,408 N
  // Expected torque ≈ 49-55 Nm (VDI 2230 Table A1 reference range)
  it('M10 8.8 at 90% proof: torque in VDI 2230 reference range', () => {
    const preload = 0.9 * grade88.Rp02 * M10_pan.stressArea;
    const torque = calculateTorque(preload, M10_pan, steelDry);
    expect(torque).toBeGreaterThan(45);
    expect(torque).toBeLessThan(60);
  });

  it('torque scales linearly with preload', () => {
    const t1 = calculateTorque(10000, M8_pan, steelDry);
    const t2 = calculateTorque(20000, M8_pan, steelDry);
    expect(t2).toBeCloseTo(t1 * 2, 1);
  });

  it('oiled surface gives lower torque than dry', () => {
    const tDry = calculateTorque(10000, M6_pan, steelDry);
    const tOil = calculateTorque(10000, M6_pan, steelOiled);
    expect(tOil).toBeLessThan(tDry);
  });

  it('smaller bolt gives lower torque for same preload', () => {
    const t3 = calculateTorque(5000, M3_pan, steelDry);
    const t6 = calculateTorque(5000, M6_pan, steelDry);
    expect(t3).toBeLessThan(t6);
  });
});

describe('calculatePreload', () => {
  it('is the inverse of calculateTorque', () => {
    const preload = 15000;
    const torque = calculateTorque(preload, M8_pan, steelDry);
    const recovered = calculatePreload(torque, M8_pan, steelDry);
    expect(recovered).toBeCloseTo(preload, 0);
  });

  it('inverse roundtrip works for all screw sizes', () => {
    for (const size of ['M3', 'M6', 'M10']) {
      const screw = screwDatabase.find(s => s.size === size && s.standard === 'ISO 14580')!;
      const preload = 10000;
      const torque = calculateTorque(preload, screw, steelDry);
      const recovered = calculatePreload(torque, screw, steelDry);
      expect(recovered).toBeCloseTo(preload, 0);
    }
  });

  it('M10 at 50 Nm gives reasonable preload', () => {
    const preload = calculatePreload(50, M10_pan, steelDry);
    // 50 Nm on M10 with μ=0.12 → F_V should be ~30-35 kN
    expect(preload).toBeGreaterThan(25000);
    expect(preload).toBeLessThan(40000);
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
    const axialUtil = (result.axialStress / result.Rp02) * 100;
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

  it('70% axial utilization → von Mises ~80-90%', () => {
    // VDI 2230 rule of thumb: von Mises ≈ 10-20% higher than axial
    const preload = 0.7 * grade88.Rp02 * M8_pan.stressArea;
    const result = calculateBoltStress(preload, M8_pan, grade88, steelDry);
    expect(result.utilization).toBeGreaterThan(75);
    expect(result.utilization).toBeLessThan(95);
  });

  it('zero preload gives zero stress', () => {
    const result = calculateBoltStress(0, M8_pan, grade88, steelDry);
    expect(result.axialStress).toBe(0);
    expect(result.torsionalStress).toBe(0);
    expect(result.vonMisesStress).toBe(0);
    expect(result.utilization).toBe(0);
  });

  it('higher grade has lower utilization at same preload', () => {
    const r88 = calculateBoltStress(20000, M8_pan, grade88, steelDry);
    const r109 = calculateBoltStress(20000, M8_pan, grade109, steelDry);
    expect(r109.utilization).toBeLessThan(r88.utilization);
  });
});

describe('calculateTorsionalStress', () => {
  it('torsional stress increases with friction', () => {
    const tDry = calculateTorsionalStress(10000, M8_pan, steelDry);
    const tOil = calculateTorsionalStress(10000, M8_pan, steelOiled);
    expect(tDry).toBeGreaterThan(tOil);
  });

  it('torsional stress is proportional to preload', () => {
    const t1 = calculateTorsionalStress(10000, M8_pan, steelDry);
    const t2 = calculateTorsionalStress(20000, M8_pan, steelDry);
    expect(t2).toBeCloseTo(t1 * 2, 0);
  });
});
