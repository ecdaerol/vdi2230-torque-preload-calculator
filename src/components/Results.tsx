import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { FrictionPair } from '../data/friction';
import { WasherData } from '../data/washers';
import { NutData } from '../data/nuts';
import { AssemblyType } from './AssemblyDiagram';
import { BoltGrade, calculateTorque } from '../calc/torque';
import { calculateBoltStress, BoltStressResult } from '../calc/torque';
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

function safe(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '\u2014';
  return n.toFixed(1);
}

function safeN(n: number, decimals: number): string {
  if (!isFinite(n) || isNaN(n)) return '\u2014';
  return n.toFixed(decimals);
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

export default function Results({ utilization, preload, torque, screw, clampedMaterial, tappedMaterial, friction, grade, engagementLength, clampLength, useImperial, assemblyType, headWasher, nutWasher, nut }: Props) {
  if (!screw || utilization <= 0) {
    return (
      <div className="card p-5">
        <p className="text-center" style={{ color: 'var(--muted)' }}>Select a screw and enter a value to see results.</p>
      </div>
    );
  }

  // --- Validation: preload must be positive ---
  if (preload <= 0) {
    return (
      <div className="card p-5">
        <p className="text-center text-sm font-medium" style={{ color: 'var(--danger)' }}>
          Set utilization above 0%
        </p>
      </div>
    );
  }

  // Actual von Mises utilization (includes torsional stress)
  const boltStress: BoltStressResult | null = (screw && preload > 0)
    ? calculateBoltStress(preload, screw, grade, friction)
    : null;

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

  // --- Thread stripping (skip gracefully if engagementLength <= 0) ---
  let ts: ThreadStrippingResult | null = null;
  if (assemblyType !== 'through-nut' && tappedMaterial && engagementLength > 0) {
    ts = calculateThreadStripping(preload, screw, tappedMaterial, engagementLength);
  }

  // --- Joint stiffness (skip gracefully if clampLength <= 0) ---
  let js: JointStiffnessResult | null = null;
  if (clampedMaterial && clampLength > 0) {
    js = calculateJointStiffness(preload, screw, clampedMaterial, clampLength, grade.name);
  }

  // Torque range accounting for ±20% friction scatter (VDI 2230)
  const torqueMin = calculateTorque(preload, screw, {
    ...friction,
    muThread: friction.muThread * 0.8,
    muHead: friction.muHead * 0.8,
  });
  const torqueMax = calculateTorque(preload, screw, {
    ...friction,
    muThread: friction.muThread * 1.2,
    muHead: friction.muHead * 1.2,
  });

  const Nto = useImperial ? 0.2248 : 1;
  const Nmto = useImperial ? 0.7376 : 1;
  const forceUnit = useImperial ? 'lbf' : 'N';
  const torqueUnit = useImperial ? 'lb\u00b7ft' : 'N\u00b7m';
  const pressureUnit = 'MPa';

  const safetyColor = (sf: number) =>
    sf < 1 ? 'var(--danger)' : sf < 1.5 ? 'var(--warn)' : 'var(--ok)';

  return (
    <div className="space-y-4">
      {/* Primary result */}
      <div className="card p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Results</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Tightening Torque</div>
            <div className="text-2xl font-bold font-mono" style={{ color: 'var(--brand)' }}>
              {safeN(torque * Nmto, 3)} <span className="text-sm">{torqueUnit}</span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
              Range: {safeN(torqueMin * Nmto, 3)} – {safeN(torqueMax * Nmto, 3)} {torqueUnit} (±20% friction scatter)
            </div>
          </div>
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Preload Force</div>
            <div className="text-2xl font-bold font-mono" style={{ color: 'var(--brand)' }}>
              {safeN(preload * Nto, 0)} <span className="text-sm">{forceUnit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Polymer creep warning */}
      {(clampedMaterial?.category === 'polymer' || clampedMaterial?.category === 'composite' ||
        tappedMaterial?.category === 'polymer' || tappedMaterial?.category === 'composite') && (
        <div className="card p-5" style={{ backgroundColor: '#fff8e1', borderLeft: '4px solid #ffa000' }}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#e65100' }}>
            Polymer Creep Warning
          </h3>
          <p className="text-sm mb-2" style={{ color: '#4e342e' }}>
            PA12/PEEK and similar polymers lose 10–30% of preload over time due to creep and stress relaxation.
          </p>
          <p className="text-sm font-medium mb-1" style={{ color: '#4e342e' }}>Consider:</p>
          <ul className="text-sm list-disc list-inside space-y-0.5" style={{ color: '#4e342e' }}>
            <li>Re-torquing after 24h settling period</li>
            <li>Designing for lower initial utilization (50-70%)</li>
            <li>Using a washer to distribute load</li>
            <li>Service preload ≈ 70-85% of initial preload</li>
          </ul>
        </div>
      )}

      {/* Bolt stress (von Mises) */}
      <div className="card p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
          Bolt Stress — {grade.name}
        </h3>
        {boltStress && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>&sigma; axial</div>
                <div className="text-sm font-mono font-semibold">{safe(boltStress.axialStress)} MPa</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>&tau; torsion</div>
                <div className="text-sm font-mono font-semibold">{safe(boltStress.torsionalStress)} MPa</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>&sigma; von Mises</div>
                <div className="text-sm font-mono font-bold" style={{ color: boltStress.utilization > 100 ? 'var(--danger)' : boltStress.utilization > 90 ? 'var(--warn)' : 'var(--ok)' }}>
                  {safe(boltStress.vonMisesStress)} MPa
                </div>
              </div>
            </div>
            {/* Utilization bar */}
            <div className="mb-1">
              <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider mb-1">
                <span style={{ color: 'var(--muted)' }}>Von Mises Utilization</span>
                <span className="font-mono" style={{ color: boltStress.utilization > 100 ? 'var(--danger)' : boltStress.utilization > 90 ? 'var(--warn)' : 'var(--ok)' }}>
                  {safe(boltStress.utilization)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#eeeeee' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(boltStress.utilization, 100)}%`,
                    background: boltStress.utilization > 100
                      ? 'linear-gradient(90deg, #ef5350, #d50000)'
                      : boltStress.utilization > 90
                      ? 'linear-gradient(90deg, #fb8c00, #e65100)'
                      : boltStress.utilization > 70
                      ? 'linear-gradient(90deg, #66bb6a, #43a047)'
                      : 'linear-gradient(90deg, #66bb6a, #43a047)'
                  }}
                />
              </div>
            </div>
            <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
              Rp0.2 = {grade.proofStress} MPa &middot; Target: {utilization}% (axial) &rarr; Actual: {safe(boltStress.utilization)}% (von Mises)
            </div>
            {boltStress.utilization > 100 && (
              <div className="mt-2 text-xs font-semibold" style={{ color: 'var(--danger)' }}>
                Bolt proof load exceeded! Reduce utilization or use a higher grade.
              </div>
            )}
          </>
        )}
      </div>

      {/* Surface pressure — head side */}
      <div className="card p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
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
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Pressure</div>
                <div className="text-sm font-mono font-semibold">{safe(sp!.pressure)} {pressureUnit}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Limit (&sigma;y)</div>
                <div className="text-sm font-mono font-semibold">{safe(sp!.limit)} {pressureUnit}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Safety Factor</div>
                <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(sp!.safetyFactor) }}>
                  {safeN(sp!.safetyFactor, 2)}
                </div>
              </div>
            </div>
            <div className="mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>Bearing area: {safe(sp!.bearingArea)} mm²</div>
          </>
        )}
      </div>

      {/* Surface pressure — nut side (through-nut only) */}
      {assemblyType === 'through-nut' && (
        <div className="card p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Surface Pressure (Nut){tappedMaterial ? ` — ${tappedMaterial.name}` : ''}{nutWasher ? ` + ${nutWasher.standard} washer` : ''}
            </h3>
            <StatusBadge status={!spNut ? 'na' : spNut.status} />
          </div>
          {!spNut ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Select bottom material and nut to check nut-side surface pressure.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Pressure</div>
                  <div className="text-sm font-mono font-semibold">{safe(spNut.pressure)} {pressureUnit}</div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Limit (&sigma;y)</div>
                  <div className="text-sm font-mono font-semibold">{safe(spNut.limit)} {pressureUnit}</div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Safety Factor</div>
                  <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(spNut.safetyFactor) }}>
                    {safeN(spNut.safetyFactor, 2)}
                  </div>
                </div>
              </div>
              <div className="mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>Bearing area: {safe(spNut.bearingArea)} mm²</div>
            </>
          )}
        </div>
      )}

      {/* Thread stripping */}
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
                <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(ts.safetyFactor) }}>
                  {safeN(ts.safetyFactor, 2)}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Min. Engagement</div>
                <div className="text-sm font-mono font-semibold">{safe(ts.minEngagementLength)} mm</div>
              </div>
            </div>
            {ts.status !== 'ok' && (
              <div className="mt-2 text-xs" style={{ color: 'var(--warn)' }}>
                Increase engagement length to &ge; {safe(ts.minEngagementLength)} mm for SF &ge; 1.5
              </div>
            )}
          </>
        )}
      </div>

      {/* Joint stiffness summary */}
      {js && (
        <div className="card p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Joint Stiffness</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Bolt k_b</div>
              <div className="text-sm font-mono font-semibold">{safe(js.boltStiffness / 1000)} kN/mm</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Clamp k_c</div>
              <div className="text-sm font-mono font-semibold">{safe(js.clampStiffness / 1000)} kN/mm</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Load Factor n</div>
              <div className="text-sm font-mono font-semibold">{safeN(js.loadFactor, 3)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
