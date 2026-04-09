import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { FrictionPair } from '../data/friction';
import { WasherData } from '../data/washers';
import { NutData } from '../data/nuts';
import { AssemblyType } from './AssemblyDiagram';
import { BoltGrade, calculateTorque, calculatePreload, calculateBoltUtilization } from '../calc/torque';
import { calculateSurfacePressure, SurfacePressureResult } from '../calc/surfacePressure';
import { calculateThreadStripping, ThreadStrippingResult } from '../calc/threadStripping';
import { calculateJointStiffness, JointStiffnessResult } from '../calc/jointStiffness';

interface Props {
  mode: 'torque-to-preload' | 'preload-to-torque';
  inputValue: number;
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
  const styles = {
    ok: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    na: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  };
  const labels = { ok: 'OK', warning: 'WARNING', danger: 'DANGER', na: 'N/A' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-mono font-bold">{pct.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Results({ mode, inputValue, screw, clampedMaterial, tappedMaterial, friction, grade, engagementLength, clampLength, useImperial, assemblyType, headWasher, nutWasher, nut }: Props) {
  if (!screw || !inputValue) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <p className="text-slate-400 text-center">Select a screw and enter a value to see results.</p>
      </div>
    );
  }

  // Calculate
  let torque: number;
  let preload: number;

  if (mode === 'torque-to-preload') {
    torque = inputValue;
    preload = calculatePreload(inputValue, screw, friction);
  } else {
    preload = inputValue;
    torque = calculateTorque(inputValue, screw, friction);
  }

  const utilization = calculateBoltUtilization(preload, screw, grade);

  // --- Surface pressure (head side) ---
  // When washer is present, bearing area = washer OD/ID; otherwise screw head
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
  // For tapped-hole/standoff: check tapped material
  // For through-nut: no thread stripping risk in parts (nut is steel)
  let ts: ThreadStrippingResult | null = null;
  if (assemblyType !== 'through-nut' && tappedMaterial && engagementLength > 0) {
    ts = calculateThreadStripping(preload, screw, tappedMaterial, engagementLength);
  }

  // Joint stiffness — uses clamped material for clamp stiffness
  let js: JointStiffnessResult | null = null;
  if (clampedMaterial && clampLength > 0) {
    js = calculateJointStiffness(preload, screw, clampedMaterial, clampLength);
  }

  const Nto = useImperial ? 0.2248 : 1;
  const Nmto = useImperial ? 0.7376 : 1;
  const forceUnit = useImperial ? 'lbf' : 'N';
  const torqueUnit = useImperial ? 'lb·ft' : 'N·m';
  const pressureUnit = 'MPa';

  return (
    <div className="space-y-4">
      {/* Primary result */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Results</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">Tightening Torque</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono">
              {(torque * Nmto).toFixed(3)} <span className="text-sm">{torqueUnit}</span>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">Preload Force</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono">
              {(preload * Nto).toFixed(0)} <span className="text-sm">{forceUnit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bolt utilization */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200">Bolt Utilization ({grade.name})</h3>
        <ProgressBar value={utilization} max={100} label={`${(preload * Nto).toFixed(0)} ${forceUnit} / ${(grade.proofStress * screw.stressArea * Nto).toFixed(0)} ${forceUnit}`} />
        {utilization > 100 && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
            Bolt proof load exceeded! Reduce torque or use a higher grade.
          </div>
        )}
      </div>

      {/* Surface pressure — head side (clamped material) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Surface Pressure (Head){clampedMaterial ? ` — ${clampedMaterial.name}` : ''}{headWasher ? ` + ${headWasher.standard} washer` : ''}
          </h3>
          <StatusBadge status={!hasSurfacePressure ? 'na' : sp!.status} />
        </div>
        {!hasSurfacePressure ? (
          <p className="text-sm text-slate-400">
            {!screw.hasHead ? 'N/A for set screws (no bearing surface)' : 'Select a clamped material to check surface pressure.'}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Pressure</div>
                <div className="font-mono font-bold">{sp!.pressure.toFixed(1)} {pressureUnit}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Limit (σy)</div>
                <div className="font-mono font-bold">{sp!.limit.toFixed(1)} {pressureUnit}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Safety Factor</div>
                <div className={`font-mono font-bold ${sp!.safetyFactor < 1 ? 'text-red-600' : sp!.safetyFactor < 1.5 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {sp!.safetyFactor.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-400">Bearing area: {sp!.bearingArea.toFixed(1)} mm²</div>
          </>
        )}
      </div>

      {/* Surface pressure — nut side (through-nut only) */}
      {assemblyType === 'through-nut' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Surface Pressure (Nut){tappedMaterial ? ` — ${tappedMaterial.name}` : ''}{nutWasher ? ` + ${nutWasher.standard} washer` : ''}
            </h3>
            <StatusBadge status={!spNut ? 'na' : spNut.status} />
          </div>
          {!spNut ? (
            <p className="text-sm text-slate-400">Select bottom material and nut to check nut-side surface pressure.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Pressure</div>
                  <div className="font-mono font-bold">{spNut.pressure.toFixed(1)} {pressureUnit}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Limit (σy)</div>
                  <div className="font-mono font-bold">{spNut.limit.toFixed(1)} {pressureUnit}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Safety Factor</div>
                  <div className={`font-mono font-bold ${spNut.safetyFactor < 1 ? 'text-red-600' : spNut.safetyFactor < 1.5 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {spNut.safetyFactor.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-400">Bearing area: {spNut.bearingArea.toFixed(1)} mm²</div>
            </>
          )}
        </div>
      )}

      {/* Thread stripping — tapped material (not for through-nut) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Thread Stripping {tappedMaterial ? `— ${tappedMaterial.name}` : ''}
          </h3>
          <StatusBadge status={assemblyType === 'through-nut' ? 'na' : (!ts ? 'na' : ts.status)} />
        </div>
        {assemblyType === 'through-nut' ? (
          <p className="text-sm text-slate-400">N/A — through-bolt with nut (no thread engagement in parts).</p>
        ) : !ts ? (
          <p className="text-sm text-slate-400">Select a tapped material and engagement length to check thread stripping.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Strip Force</div>
                <div className="font-mono font-bold">{(ts.strippingForce * Nto).toFixed(0)} {forceUnit}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Safety Factor</div>
                <div className={`font-mono font-bold ${ts.safetyFactor < 1 ? 'text-red-600' : ts.safetyFactor < 1.5 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {ts.safetyFactor.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Min. Engagement</div>
                <div className="font-mono font-bold">{ts.minEngagementLength.toFixed(1)} mm</div>
              </div>
            </div>
            {ts.status !== 'ok' && (
              <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                Increase engagement length to ≥ {ts.minEngagementLength.toFixed(1)} mm for SF ≥ 1.5
              </div>
            )}
          </>
        )}
      </div>

      {/* Joint stiffness summary */}
      {js && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200">Joint Stiffness</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Bolt k_b</div>
              <div className="font-mono font-bold">{(js.boltStiffness / 1000).toFixed(1)} kN/mm</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Clamp k_c</div>
              <div className="font-mono font-bold">{(js.clampStiffness / 1000).toFixed(1)} kN/mm</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Load Factor n</div>
              <div className="font-mono font-bold">{js.loadFactor.toFixed(3)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
