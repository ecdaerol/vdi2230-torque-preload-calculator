import { safeN, StatusBadge, UnitFactors } from './ResultsUtils';
import { FrictionPair } from '../../data/friction';
import { TighteningMethod, calculateServicePreload } from '../../calc/preloadRealism';

interface Props {
  servicePreload: ReturnType<typeof calculateServicePreload>;
  tighteningMethod: TighteningMethod;
  friction: FrictionPair;
  totalScatter: number;
  relaxationLossPct: number;
  settlementMicrons: number;
  serviceLossPercent: number;
  units: UnitFactors;
}

export default function PreloadRealismCard({
  servicePreload, tighteningMethod, friction, totalScatter,
  relaxationLossPct, settlementMicrons, serviceLossPercent, units,
}: Props) {
  const { Nto, forceUnit } = units;

  return (
    <div className="card p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Preload Realism</h3>
        <StatusBadge status={serviceLossPercent > 20 ? 'warning' : 'ok'} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Tightening method</div>
          <div className="text-sm font-semibold">{tighteningMethod.label}</div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Combined scatter</div>
          <div className="text-sm font-mono font-semibold">±{safeN(totalScatter * 100, 1)}%</div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Relaxation loss</div>
          <div className="text-sm font-mono font-semibold">{safeN(servicePreload.relaxationLoss * Nto, 0)} {forceUnit}</div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Settlement loss</div>
          <div className="text-sm font-mono font-semibold">{safeN(servicePreload.embeddingLoss * Nto, 0)} {forceUnit}</div>
        </div>
      </div>
      <div className="text-[10px] space-y-1" style={{ color: 'var(--muted)' }}>
        <div>{tighteningMethod.notes}</div>
        <div>
          Inputs: preset scatter ±{Math.round(friction.scatter * 100)}% + method scatter ±{Math.round(tighteningMethod.processScatter * 100)}% · relaxation allowance {safeN(relaxationLossPct, 0)}% · settlement {safeN(settlementMicrons, 0)} μm
        </div>
        <div>
          {servicePreload.equivalentStiffness > 0
            ? `Equivalent joint stiffness for settlement loss: ${safeN(servicePreload.equivalentStiffness / 1000, 3)} kN/mm`
            : 'Settlement loss uses the clamp model when clamp material and clamp length are available.'}
        </div>
      </div>
    </div>
  );
}
