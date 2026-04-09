import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { FrictionPair } from '../data/friction';
import { BoltGrade, calculateTorque, calculatePreload, calculateBoltUtilization } from '../calc/torque';
import { calculateSurfacePressure, SurfacePressureResult } from '../calc/surfacePressure';
import { calculateThreadStripping, ThreadStrippingResult } from '../calc/threadStripping';
import { calculateJointStiffness, JointStiffnessResult } from '../calc/jointStiffness';

interface Props {
  mode: 'torque-to-preload' | 'preload-to-torque';
  inputValue: number;
  screw: ScrewData | null;
  material: MaterialData | null;
  friction: FrictionPair;
  grade: BoltGrade;
  engagementLength: number;
  clampLength: number;
  useImperial: boolean;
}

function StatusBadge({ status }: { status: 'ok' | 'warning' | 'danger' }) {
  const styles = {
    ok: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  const labels = { ok: 'OK', warning: 'WARNING', danger: 'DANGER' };
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

export default function Results({ mode, inputValue, screw, material, friction, grade, engagementLength, clampLength, useImperial }: Props) {
  if (!screw || !material || !inputValue) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <p className="text-slate-400 text-center">Select screw, material, and enter a value to see results.</p>
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
  const sp: SurfacePressureResult = calculateSurfacePressure(preload, screw, material);
  const ts: ThreadStrippingResult = calculateThreadStripping(preload, screw, material, engagementLength);
  const js: JointStiffnessResult = calculateJointStiffness(preload, screw, material, clampLength);

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
            ⚠ Bolt proof load exceeded! Reduce torque or use a higher grade.
          </div>
        )}
      </div>

      {/* Surface pressure */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Surface Pressure</h3>
          <StatusBadge status={sp.status} />
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Pressure</div>
            <div className="font-mono font-bold">{sp.pressure.toFixed(1)} {pressureUnit}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Limit (σy)</div>
            <div className="font-mono font-bold">{sp.limit.toFixed(1)} {pressureUnit}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Safety Factor</div>
            <div className={`font-mono font-bold ${sp.safetyFactor < 1 ? 'text-red-600' : sp.safetyFactor < 1.5 ? 'text-yellow-600' : 'text-green-600'}`}>
              {sp.safetyFactor.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="mt-1 text-xs text-slate-400">Bearing area: {sp.bearingArea.toFixed(1)} mm²</div>
      </div>

      {/* Thread stripping */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Thread Stripping ({material.name})</h3>
          <StatusBadge status={ts.status} />
        </div>
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
      </div>

      {/* Joint stiffness summary */}
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
    </div>
  );
}
