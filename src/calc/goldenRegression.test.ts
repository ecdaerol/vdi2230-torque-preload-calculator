import { describe, expect, it } from 'vitest';
import { calculateTorque } from './torque';
import { screwDatabase } from '../data/screws';
import { frictionDatabase } from '../data/friction';
import { goldenCases } from './golden-cases';

describe('golden regression torque cases', () => {
  it('matches the approved benchmark dataset within tolerance', () => {
    for (const c of goldenCases) {
      const screw = screwDatabase.find((s) => s.standard === c.screwStandard && s.size === c.screwSize);
      const friction = frictionDatabase.find((f) => f.name === c.frictionName && f.condition === c.frictionCondition);

      expect(screw, `Missing screw for ${c.id}`).toBeTruthy();
      expect(friction, `Missing friction for ${c.id}`).toBeTruthy();

      const torque = calculateTorque(c.preloadN, screw!, friction!);
      expect(
        Math.abs(torque - c.expectedTorqueNm),
        `${c.id}: expected ${c.expectedTorqueNm} ± ${c.toleranceNm}, got ${torque}`,
      ).toBeLessThanOrEqual(c.toleranceNm);
    }
  });
});

describe('torque model invariants', () => {
  it('torque increases monotonically with preload for fixed geometry and friction', () => {
    const screw = screwDatabase.find((s) => s.standard === 'ISO 14580' && s.size === 'M8')!;
    const friction = frictionDatabase.find((f) => f.name === 'Steel on Steel' && f.condition === 'Dry')!;

    const t1 = calculateTorque(5000, screw, friction);
    const t2 = calculateTorque(10000, screw, friction);
    const t3 = calculateTorque(15000, screw, friction);

    expect(t2).toBeGreaterThan(t1);
    expect(t3).toBeGreaterThan(t2);
  });

  it('for fixed preload and geometry, higher thread/head friction yields higher torque', () => {
    const screw = screwDatabase.find((s) => s.standard === 'ISO 14580' && s.size === 'M8')!;

    const low = { ...frictionDatabase.find((f) => f.name === 'Steel on Steel' && f.condition === 'Dry')!, muThread: 0.08, muHead: 0.08 };
    const high = { ...low, muThread: 0.16, muHead: 0.16 };

    const tLow = calculateTorque(12000, screw, low);
    const tHigh = calculateTorque(12000, screw, high);

    expect(tHigh).toBeGreaterThan(tLow);
  });
});
