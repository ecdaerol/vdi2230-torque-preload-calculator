import { safeN, safetyColor, StatusBadge, getOperatingStatus, UnitFactors } from './ResultsUtils';
import { OperatingStateResult } from '../../calc/operatingState';

interface Props {
  operatingState: OperatingStateResult | null;
  axialServiceLoad: number;
  shearServiceLoad: number;
  slipFriction: number;
  units: UnitFactors;
}

export default function OperatingStateCard({ operatingState, axialServiceLoad, shearServiceLoad, slipFriction, units }: Props) {
  const { Nto, forceUnit } = units;
  const status = getOperatingStatus(axialServiceLoad, shearServiceLoad, operatingState);

  return (
    <div className="card p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Operating State</h3>
        <StatusBadge status={status} />
      </div>
      {!operatingState ? (
        axialServiceLoad > 0 || shearServiceLoad > 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Operating-load checks need a clamp stiffness model. Select clamp material and clamp length to evaluate separation and slip.
          </p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Enter axial or transverse service loads to evaluate separation, slip, and simple shear behavior.
          </p>
        )
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Axial load</div>
              <div className="text-sm font-mono font-semibold">{safeN(axialServiceLoad * Nto, 0)} {forceUnit}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Added bolt load</div>
              <div className="text-sm font-mono font-semibold">{safeN(operatingState.additionalBoltLoad * Nto, 0)} {forceUnit}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Remaining clamp</div>
              <div className="text-sm font-mono font-semibold" style={{ color: operatingState.remainingClampForce <= 0 ? 'var(--danger)' : 'var(--ink)' }}>
                {safeN(operatingState.remainingClampForce * Nto, 0)} {forceUnit}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Bolt force under load</div>
              <div className="text-sm font-mono font-semibold">{safeN(operatingState.boltForceUnderAxialLoad * Nto, 0)} {forceUnit}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Separation load</div>
              <div className="text-sm font-mono font-semibold">{safeN(operatingState.separationLoad * Nto, 0)} {forceUnit}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Separation margin</div>
              <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(operatingState.separationMargin) }}>
                {safeN(operatingState.separationMargin, 2)}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Slip resistance</div>
              <div className="text-sm font-mono font-semibold">{safeN(operatingState.availableSlipResistance * Nto, 0)} {forceUnit}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Slip safety factor</div>
              <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(operatingState.slipSafetyFactor) }}>
                {safeN(operatingState.slipSafetyFactor, 2)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Shear load</div>
              <div className="text-sm font-mono font-semibold">{safeN(shearServiceLoad * Nto, 0)} {forceUnit}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Shear stress</div>
              <div className="text-sm font-mono font-semibold">{safeN(operatingState.shearStress, 1)} MPa</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Shear allowable</div>
              <div className="text-sm font-mono font-semibold">{safeN(operatingState.shearAllowable, 1)} MPa</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Shear safety factor</div>
              <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(operatingState.shearSafetyFactor) }}>
                {safeN(operatingState.shearSafetyFactor, 2)}
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] space-y-1" style={{ color: 'var(--muted)' }}>
            <div>Load split from stiffness model: bolt share n = {safeN(operatingState.boltLoadShare, 3)} · clamp share = {safeN(operatingState.clampLoadShare, 3)}</div>
            <div>Slip check uses remaining service clamp load and μ = {safeN(slipFriction, 2)} at the clamped interface.</div>
          </div>
        </>
      )}
    </div>
  );
}
