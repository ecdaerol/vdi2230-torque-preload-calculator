import { safe, safeN, safetyColor, StatusBadge, UnitFactors } from './ResultsUtils';
import { ScrewData } from '../../data/screws';
import { MaterialData } from '../../data/materials';
import { WasherData } from '../../data/washers';
import { SurfacePressureResult } from '../../calc/surfacePressure';
import { ThreadStrippingResult } from '../../calc/threadStripping';
import { JointStiffnessResult } from '../../calc/jointStiffness';
import { AssemblyType } from '../../domain/types';

interface SurfacePressureProps {
  side: 'head' | 'nut';
  sp: SurfacePressureResult | null;
  material: MaterialData | null;
  washer: WasherData | null;
  screw: ScrewData;
  available: boolean;
  units: UnitFactors;
}

export function SurfacePressureCard({ side, sp, material, washer, screw, available, units }: SurfacePressureProps) {
  const label = side === 'head' ? 'Surface Pressure (Head)' : 'Surface Pressure (Nut)';
  const materialLabel = material ? ` — ${material.name}` : '';
  const washerLabel = washer ? ` + ${washer.standard} washer` : '';

  return (
    <div className="card p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          {label}{materialLabel}{washerLabel}
        </h3>
        <StatusBadge status={!available ? 'na' : sp!.status} />
      </div>
      {!available ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {side === 'head'
            ? (!screw.hasHead ? 'N/A for set screws (no bearing surface)' : screw.isCountersunk ? 'N/A for countersunk heads' : 'Select a clamped material to check surface pressure.')
            : 'Select bottom material and nut to check nut-side surface pressure.'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Pressure</div>
              <div className="text-sm font-mono font-semibold">{safe(sp!.pressure)} {units.pressureUnit}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Limit (σy)</div>
              <div className="text-sm font-mono font-semibold">{safe(sp!.limit)} {units.pressureUnit}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Safety Factor</div>
              <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(sp!.safetyFactor) }}>{safeN(sp!.safetyFactor, 2)}</div>
            </div>
          </div>
          <div className="mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>Bearing area: {safe(sp!.bearingArea)} mm²</div>
        </>
      )}
    </div>
  );
}

interface ThreadStrippingProps {
  ts: ThreadStrippingResult | null;
  tappedMaterial: MaterialData | null;
  assemblyType: AssemblyType;
  units: UnitFactors;
}

export function ThreadStrippingCard({ ts, tappedMaterial, assemblyType, units }: ThreadStrippingProps) {
  const { Nto, forceUnit } = units;

  return (
    <div className="card p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Thread Stripping {tappedMaterial ? `— ${tappedMaterial.name}` : ''}
        </h3>
        <StatusBadge status={assemblyType === 'through-nut' ? 'na' : (!ts ? 'na' : ts.status)} />
      </div>
      {assemblyType === 'through-nut' ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>N/A — through-bolt with nut (no thread engagement in parts).</p>
      ) : !ts ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Select a tapped material and engagement length to check thread stripping.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Strip Force</div>
              <div className="text-sm font-mono font-semibold">{safeN(ts.strippingForce * Nto, 0)} {forceUnit}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Safety Factor</div>
              <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(ts.safetyFactor) }}>{safeN(ts.safetyFactor, 2)}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Min. Engagement</div>
              <div className="text-sm font-mono font-semibold">{safe(ts.minEngagementLength)} mm</div>
            </div>
          </div>
          <div className="mt-2 text-[10px] space-y-1" style={{ color: 'var(--muted)' }}>
            <div>Receiver: <span className="font-semibold">{ts.receiverLabel}</span> · Capacity factor ×{safeN(ts.receiverFactor, 2)}</div>
            <div>
              Critical mode: <span className="font-semibold">{ts.criticalMode === 'internal' ? 'Internal (nut/tapped material)' : 'External (bolt thread)'}</span>
              {ts.externalStrippingForce !== Infinity && (
                <> · Internal: {safeN(ts.internalStrippingForce * Nto, 0)} {forceUnit} · External: {safeN(ts.externalStrippingForce * Nto, 0)} {forceUnit}</>
              )}
            </div>
          </div>
          {ts.status !== 'ok' && (
            <div className="mt-2 text-xs" style={{ color: 'var(--warn)' }}>
              Increase engagement length to ≥ {safe(ts.minEngagementLength)} mm for SF ≥ 1.5
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface JointStiffnessProps {
  js: JointStiffnessResult;
  clampedMaterial: MaterialData | null;
  tappedMaterial: MaterialData | null;
  clampLength: number;
  clampLengthSplit: number;
}

export function JointStiffnessCard({ js, clampedMaterial, tappedMaterial, clampLength, clampLengthSplit }: JointStiffnessProps) {
  return (
    <div className="card p-5">
      <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Joint Stiffness</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Bolt stiffness</div>
          <div className="text-sm font-mono font-semibold">{safe(js.boltStiffness / 1000)} kN/mm</div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Clamp stiffness</div>
          <div className="text-sm font-mono font-semibold">{safe(js.clampStiffness / 1000)} kN/mm</div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Load Factor n</div>
          <div className="text-sm font-mono font-semibold">{safeN(js.loadFactor, 3)}</div>
        </div>
      </div>
      {tappedMaterial && (
        <div className="mt-2 text-[10px]" style={{ color: 'var(--muted)' }}>
          Stiffness model: {clampedMaterial?.name ?? 'Top material'} {safe(clampLengthSplit)} mm + {tappedMaterial.name} {safe(Math.max(0, clampLength - clampLengthSplit))} mm
        </div>
      )}
    </div>
  );
}
