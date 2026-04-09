import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { FrictionPair } from '../data/friction';
import { WasherData } from '../data/washers';
import { NutData } from '../data/nuts';
import { AssemblyType } from './AssemblyDiagram';
import { BoltGrade } from '../calc/torque';
import { calculateSurfacePressure, SurfacePressureResult } from '../calc/surfacePressure';
import { calculateThreadStripping, ThreadStrippingResult } from '../calc/threadStripping';
import { calculateJointStiffness, JointStiffnessResult } from '../calc/jointStiffness';

interface Props {
  utilization: number;
  preload: number;
  torque: number;
  screw: ScrewData | null;
  clampedMaterial: MaterialData | null;
  tappedMaterial: MaterialData | null;
  friction: FrictionPair;
  grade: BoltGrade;
  engagementLength: number;
  clampLength: number;
  useImperial: boolean;
  assemblyType: AssemblyType;
  headWasher: WasherData | null;
  nutWasher: WasherData | null;
  nut: NutData | null;
}

function StatusBadge({ status }: { status: 'ok' | 'warning' | 'danger' | 'na' }) {
  const styles: Record<string, React.CSSProperties> = {
    ok:      { backgroundColor: '#e8f5e9', color: '#067647' },
    warning: { backgroundColor: '#fff3e0', color: '#fb8c00' },
    danger:  { backgroundColor: '#fbe9e7', color: '#d52b1e' },
    na:      { backgroundColor: '#f5f5f5', color: '#666666' },
  };
  const labels = { ok: 'OK', warning: 'WARNING', danger: 'DANGER', na: 'N/A' };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
      style={styles[status]}
    >
      {labels[status]}
    </span>
  );
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--warn)' : 'var(--ok)';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--muted)' }}>{label}</span>
        <span className="font-mono font-bold">{pct.toFixed(1)}%</span>
      </div>
      <div className="w-full rounded-full h-2.5" style={{ backgroundColor: 'var(--line)' }}>
        <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function Results({ utilization, preload, torque, screw, clampedMaterial, tappedMaterial, friction, grade, engagementLength, clampLength, useImperial, assemblyType, headWasher, nutWasher, nut }: Props) {
  if (!screw || utilization <= 0) {
    return (
      <div className="card p-6">
        <p className="text-center" style={{ color: 'var(--muted)' }}>Select a screw and enter a value to see results.</p>
      </div>
    );
  }

  // --- Surface pressure (head side) ---
  const hasSurfacePressure = screw.hasHead && clampedMaterial;
  let sp: SurfacePressureResult | null = null;
  if (hasSurfacePressure) {
    const bearingOD = headWasher ? headWasher.outerDiameter : undefined;
    const bearingID = headWasher ? headWasher.innerDiameter : undefined;
    sp = calculateSurfacePressure(preload, screw, clampedMaterial!, bearingOD, bearingID);
  }

  // --- Surface pressure (nut side) — only for through-nut ---
  let spNut: SurfacePressureResult | null = null;
  if (assemblyType === 'through-nut' && tappedMaterial && nut) {
    const nutBearingOD = nutWasher ? nutWasher.outerDiameter : nut.bearingDiameter;
    const nutBearingID = nutWasher ? nutWasher.innerDiameter : screw.holeDiameter;
    spNut = calculateSurfacePressure(preload, screw, tappedMaterial, nutBearingOD, nutBearingID);
  }

  // --- Thread stripping ---
  let ts: ThreadStrippingResult | null = null;
  if (assemblyType !== 'through-nut' && tappedMaterial && engagementLength > 0) {
    ts = calculateThreadStripping(preload, screw, tappedMaterial, engagementLength);
  }

  // Joint stiffness
  let js: JointStiffnessResult | null = null;
  if (clampedMaterial && clampLength > 0) {
    js = calculateJointStiffness(preload, screw, clampedMaterial, clampLength);
  }

  const Nto = useImperial ? 0.2248 : 1;
  const Nmto = useImperial ? 0.7376 : 1;
  const forceUnit = useImperial ? 'lbf' : 'N';
  const torqueUnit = useImperial ? 'lb·ft' : 'N·m';
  const pressureUnit = 'MPa';

  const safetyColor = (sf: number) =>
    sf < 1 ? 'var(--danger)' : sf < 1.5 ? 'var(--warn)' : 'var(--ok)';

  return (
    <div className="space-y-4">
      {/* Primary result */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--ink)' }}>Results</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg p-4" style={{ backgroundColor: '#fbe9e7' }}>
            <div className="text-xs font-medium uppercase" style={{ color: 'var(--brand)' }}>Tightening Torque</div>
            <div className="text-2xl font-bold font-mono" style={{ color: 'var(--brand-2)' }}>
              {(torque * Nmto).toFixed(3)} <span className="text-sm">{torqueUnit}</span>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ backgroundColor: '#fbe9e7' }}>
            <div className="text-xs font-medium uppercase" style={{ color: 'var(--brand)' }}>Preload Force</div>
            <div className="text-2xl font-bold font-mono" style={{ color: 'var(--brand-2)' }}>
              {(preload * Nto).toFixed(0)} <span className="text-sm">{forceUnit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bolt utilization */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Bolt Utilization ({grade.name})</h3>
        <ProgressBar value={utilization} max={100} label={`${(preload * Nto).toFixed(0)} ${forceUnit} / ${(grade.proofStress * screw.stressArea * Nto).toFixed(0)} ${forceUnit}`} />
        {utilization > 100 && (
          <div className="mt-2 text-sm font-medium" style={{ color: 'var(--danger)' }}>
            Bolt proof load exceeded! Reduce torque or use a higher grade.
          </div>
        )}
      </div>

      {/* Surface pressure — head side */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Surface Pressure (Head){clampedMaterial ? ` — ${clampedMaterial.name}` : ''}{headWasher ? ` + ${headWasher.standard} washer` : ''}
          </h3>
          <StatusBadge status={!hasSurfacePressure ? 'na' : sp!.status} />
        </div>
        {!hasSurfacePressure ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {!screw.hasHead ? 'N/A for set screws (no bearing surface)' : 'Select a clamped material to check surface pressure.'}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Pressure</div>
                <div className="font-mono font-bold">{sp!.pressure.toFixed(1)} {pressureUnit}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Limit (σy)</div>
                <div className="font-mono font-bold">{sp!.limit.toFixed(1)} {pressureUnit}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Safety Factor</div>
                <div className="font-mono font-bold" style={{ color: safetyColor(sp!.safetyFactor) }}>
                  {sp!.safetyFactor.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Bearing area: {sp!.bearingArea.toFixed(1)} mm²</div>
          </>
        )}
      </div>

      {/* Surface pressure — nut side (through-nut only) */}
      {assemblyType === 'through-nut' && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              Surface Pressure (Nut){tappedMaterial ? ` — ${tappedMaterial.name}` : ''}{nutWasher ? ` + ${nutWasher.standard} washer` : ''}
            </h3>
            <StatusBadge status={!spNut ? 'na' : spNut.status} />
          </div>
          {!spNut ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Select bottom material and nut to check nut-side surface pressure.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Pressure</div>
                  <div className="font-mono font-bold">{spNut.pressure.toFixed(1)} {pressureUnit}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Limit (σy)</div>
                  <div className="font-mono font-bold">{spNut.limit.toFixed(1)} {pressureUnit}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Safety Factor</div>
                  <div className="font-mono font-bold" style={{ color: safetyColor(spNut.safetyFactor) }}>
                    {spNut.safetyFactor.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Bearing area: {spNut.bearingArea.toFixed(1)} mm²</div>
            </>
          )}
        </div>
      )}

      {/* Thread stripping */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
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
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Strip Force</div>
                <div className="font-mono font-bold">{(ts.strippingForce * Nto).toFixed(0)} {forceUnit}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Safety Factor</div>
                <div className="font-mono font-bold" style={{ color: safetyColor(ts.safetyFactor) }}>
                  {ts.safetyFactor.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Min. Engagement</div>
                <div className="font-mono font-bold">{ts.minEngagementLength.toFixed(1)} mm</div>
              </div>
            </div>
            {ts.status !== 'ok' && (
              <div className="mt-2 text-sm" style={{ color: 'var(--warn)' }}>
                Increase engagement length to ≥ {ts.minEngagementLength.toFixed(1)} mm for SF ≥ 1.5
              </div>
            )}
          </>
        )}
      </div>

      {/* Joint stiffness summary */}
      {js && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Joint Stiffness</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Bolt k_b</div>
              <div className="font-mono font-bold">{(js.boltStiffness / 1000).toFixed(1)} kN/mm</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Clamp k_c</div>
              <div className="font-mono font-bold">{(js.clampStiffness / 1000).toFixed(1)} kN/mm</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Load Factor n</div>
              <div className="font-mono font-bold">{js.loadFactor.toFixed(3)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
