import { safe, UnitFactors } from './ResultsUtils';
import { BoltGrade, BoltStressResult } from '../../calc/torque';

interface Props {
  boltStress: BoltStressResult;
  grade: BoltGrade;
  inputMode: 'utilization' | 'torque' | 'preload';
  utilization: number;
  units: UnitFactors;
}

export default function BoltStressCard({ boltStress, grade, inputMode, utilization }: Props) {
  return (
    <div className="card p-5">
      <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Bolt Stress — {grade.name}</h3>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>σ axial</div>
          <div className="text-sm font-mono font-semibold">{safe(boltStress.axialStress)} MPa</div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>τ torsion</div>
          <div className="text-sm font-mono font-semibold">{safe(boltStress.torsionalStress)} MPa</div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>σ von Mises</div>
          <div className="text-sm font-mono font-bold" style={{ color: boltStress.utilization > 100 ? 'var(--danger)' : boltStress.utilization > 90 ? 'var(--warn)' : 'var(--ok)' }}>
            {safe(boltStress.vonMisesStress)} MPa
          </div>
        </div>
      </div>
      <div className="mb-1">
        <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider mb-1">
          <span style={{ color: 'var(--muted)' }}>Von Mises Utilization</span>
          <span className="font-mono" style={{ color: boltStress.utilization > 100 ? 'var(--danger)' : boltStress.utilization > 90 ? 'var(--warn)' : 'var(--ok)' }}>
            {safe(boltStress.utilization)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--bar-track)' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${Math.min(boltStress.utilization, 100)}%`,
              background: boltStress.utilization > 100
                ? 'var(--danger)'
                : boltStress.utilization > 90
                  ? 'var(--warn)'
                  : 'var(--ok)',
            }}
          />
        </div>
      </div>
      <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
        {inputMode === 'utilization'
          ? <>Rp₀.₂ = {grade.Rp02} MPa · Selected torque level: {utilization}% → Actual: {safe(boltStress.utilization)}% (von Mises)</>
          : inputMode === 'torque'
            ? <>Rp₀.₂ = {grade.Rp02} MPa · Derived from entered torque → Actual: {safe(boltStress.utilization)}% (von Mises)</>
            : <>Rp₀.₂ = {grade.Rp02} MPa · Derived from entered preload → Actual: {safe(boltStress.utilization)}% (von Mises)</>}
      </div>
      {boltStress.utilization > 100 && (
        <div className="mt-2 text-xs font-semibold" style={{ color: 'var(--danger)' }}>
          Bolt proof load exceeded! Reduce utilization or use a higher grade.
        </div>
      )}
    </div>
  );
}
