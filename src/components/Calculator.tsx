import { useState, useCallback } from 'react';
import ScrewSelector from './ScrewSelector';
import MaterialSelector from './MaterialSelector';
import Results from './Results';
import JointDiagram from './JointDiagram';
import AssemblyDiagram, { AssemblyType } from './AssemblyDiagram';
import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { FrictionPair, frictionDatabase } from '../data/friction';
import { WasherData, washerDatabase } from '../data/washers';
import { NutData, nutDatabase } from '../data/nuts';
import { boltGrades, calculateTorque, calculatePreload } from '../calc/torque';

// Imperial conversion constants
const NM_PER_LBFT = 1.355818;
const N_PER_LBF = 4.44822;

const assemblyOptions: { value: AssemblyType; label: string }[] = [
  {
    value: 'tapped-hole',
    label: 'Tapped Hole',
  },
  {
    value: 'through-nut',
    label: 'Nut & Bolt',
  },
  {
    value: 'standoff',
    label: 'Hex Standoff',
  },
];

function AssemblyModeIcon({ mode, active }: { mode: AssemblyType; active: boolean }) {
  const common = {
    stroke: 'currentColor',
    strokeWidth: active ? 1.35 : 1.15,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (mode === 'tapped-hole') {
    return (
      <svg width="56" height="56" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="6.2" width="16" height="2.4" rx="1" {...common} />
        <rect x="4" y="11" width="16" height="8.2" rx="1" {...common} />
        <path d="M12 3.6v12.3" {...common} />
        <path d="M9.2 3.6h5.6" {...common} />
        <path d="M10.2 13.2l-1.4.9 1.4.9" {...common} />
        <path d="M13.8 13.2l1.4.9-1.4.9" {...common} />
        <path d="M10.2 15.6l-1.4.9 1.4.9" {...common} />
        <path d="M13.8 15.6l1.4.9-1.4.9" {...common} />
      </svg>
    );
  }

  if (mode === 'through-nut') {
    return (
      <svg width="56" height="56" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="6.2" width="16" height="2.4" rx="1" {...common} />
        <rect x="4" y="11.8" width="16" height="2.4" rx="1" {...common} />
        <path d="M12 3.6v14.7" {...common} />
        <path d="M9.2 3.6h5.6" {...common} />
        <path d="M9.2 18.2h5.6l1.6 1.8-1.6 1.8H9.2L7.6 20z" {...common} />
      </svg>
    );
  }

  return (
    <svg width="56" height="56" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="6.1" width="16" height="2.4" rx="1" {...common} />
      <path d="M12 3.6v6.3" {...common} />
      <path d="M9.2 3.6h5.6" {...common} />
      <path d="M9.4 10h5.2l1.6 2-1.6 2h-5.2L7.8 12z" {...common} />
      <path d="M12 14v4.4" {...common} />
      <path d="M10.3 16.5l-1.2.8 1.2.8" {...common} />
      <path d="M13.7 16.5l1.2.8-1.2.8" {...common} />
      <rect x="4" y="18.8" width="16" height="1.7" rx="0.8" {...common} />
    </svg>
  );
}

export default function Calculator() {
  // --- Core state ---
  const [utilization, setUtilization] = useState<number>(70);
  const [screw, setScrew] = useState<ScrewData | null>(null);
  const [clampedMaterial, setClampedMaterial] = useState<MaterialData | null>(null);
  const [tappedMaterial, setTappedMaterial] = useState<MaterialData | null>(null);
  const [frictionIdx, setFrictionIdx] = useState(0);
  const [customFriction, setCustomFriction] = useState<FrictionPair | null>(null);
  const [gradeIdx, setGradeIdx] = useState(0);
  const [engagementLength, setEngagementLength] = useState(0);
  const [clampLength, setClampLength] = useState(0);
  const [clampLengthSplit, setClampLengthSplit] = useState(0);
  const [useImperial, setUseImperial] = useState(false);
  const [inputMode, setInputMode] = useState<'utilization' | 'torque' | 'preload'>('utilization');
  const [torqueInput, setTorqueInput] = useState<number>(0);
  const [preloadInput, setPreloadInput] = useState<number>(0);

  // --- New assembly state ---
  const [assemblyType, setAssemblyType] = useState<AssemblyType>('tapped-hole');
  const [headWasherIdx, setHeadWasherIdx] = useState<number>(-1);
  const [nutWasherIdx, setNutWasherIdx] = useState<number>(-1);
  const [nutIdx, setNutIdx] = useState<number>(0);
  const [standoffLength, setStandoffLength] = useState(0);

  // --- Derived values ---
  const friction = customFriction ?? frictionDatabase[frictionIdx];
  const grade = boltGrades[gradeIdx];

  const matchingWashers = screw ? washerDatabase.filter(w => w.size === screw.size) : [];
  const matchingNuts = screw ? nutDatabase.filter(n => n.size === screw.size) : [];
  const canUseHeadWasher = !!screw && screw.hasHead && !screw.isCountersunk;
  const setScrewOnlyModes = !!screw && !screw.hasHead;

  const headWasher: WasherData | null =
    canUseHeadWasher && headWasherIdx >= 0 && headWasherIdx < matchingWashers.length
      ? matchingWashers[headWasherIdx]
      : null;

  const nutWasher: WasherData | null =
    assemblyType === 'through-nut' && nutWasherIdx >= 0 && nutWasherIdx < matchingWashers.length
      ? matchingWashers[nutWasherIdx]
      : null;

  const nut: NutData | null =
    assemblyType === 'through-nut' && matchingNuts.length > 0 && nutIdx >= 0 && nutIdx < matchingNuts.length
      ? matchingNuts[nutIdx]
      : null;

  // Reset washer/nut indices when screw changes and they go out of range
  const handleScrewChange = useCallback((s: ScrewData) => {
    setScrew(s);
    if (engagementLength === 0 || engagementLength === (screw?.d ?? 0) * 1.5) {
      setEngagementLength(parseFloat((s.d * 1.5).toFixed(1)));
    }
    if (clampLength === 0 || clampLength === (screw?.d ?? 0) * 2) {
      const nextClampLength = parseFloat((s.d * 2).toFixed(1));
      setClampLength(nextClampLength);
      setClampLengthSplit(nextClampLength);
    }
    if (s.size !== screw?.size) {
      setHeadWasherIdx(-1);
      setNutWasherIdx(-1);
      setNutIdx(0);
    }
    if (!s.hasHead || s.isCountersunk) {
      setHeadWasherIdx(-1);
    }
    if (!s.hasHead && assemblyType !== 'tapped-hole') {
      setAssemblyType('tapped-hole');
    }
  }, [assemblyType, engagementLength, clampLength, screw]);

  const snapPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value / 5) * 5));

  // Compute preload and torque based on input mode
  const effectiveBearingOD = headWasher ? headWasher.outerDiameter : undefined;
  const effectiveBearingID = headWasher ? headWasher.innerDiameter : undefined;
  const fullProofTorque = screw
    ? calculateTorque(grade.Rp02 * screw.stressArea, screw, friction, effectiveBearingOD, effectiveBearingID)
    : 0;
  let preload = 0;
  let torque = 0;
  if (screw) {
    if (inputMode === 'utilization' && utilization > 0) {
      torque = (utilization / 100) * fullProofTorque;
      preload = calculatePreload(torque, screw, friction, effectiveBearingOD, effectiveBearingID);
    } else if (inputMode === 'torque' && torqueInput > 0) {
      const torqueMetric = useImperial ? torqueInput * NM_PER_LBFT : torqueInput;
      torque = torqueMetric;
      preload = calculatePreload(torqueMetric, screw, friction, effectiveBearingOD, effectiveBearingID);
    } else if (inputMode === 'preload' && preloadInput > 0) {
      const preloadMetric = useImperial ? preloadInput * N_PER_LBF : preloadInput;
      preload = preloadMetric;
      torque = calculateTorque(preloadMetric, screw, friction, effectiveBearingOD, effectiveBearingID);
    }
  }

  // --- Shared CSS classes (axiom design) ---
  const selectClass =
    'w-full px-3 py-2 text-sm focus:outline-none focus:ring-2' +
    ' bg-white' +
    ' border' +
    ' rounded-[10px]';
  const selectStyle: React.CSSProperties = {
    borderColor: 'var(--line)',
    // focus ring handled by Tailwind focus:ring
  };

  const inputClass =
    'w-full px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2' +
    ' bg-white' +
    ' border' +
    ' rounded-[10px]';

  const smallInputClass =
    'w-full px-2 py-1 text-sm font-mono bg-white border rounded-[10px]';

  // Format a washer option label
  const formatWasher = (w: WasherData): string =>
    `${w.standard} ${w.type} — Ø${w.outerDiameter.toFixed(1)} × ${w.thickness.toFixed(1)} mm`;

  // Format a nut option label
  const formatNut = (n: NutData): string =>
    `${n.standard} ${n.type} \u2014 AF ${n.width.toFixed(1)} \u00D7 H ${n.height.toFixed(1)}mm`;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar: fixed 420px on desktop, full width on mobile */}
      <div className="w-full lg:w-[420px] lg:flex-shrink-0 space-y-4">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Input Parameters</h3>

          {/* Assembly type toggle */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {assemblyOptions.map((opt) => {
              const disabled = setScrewOnlyModes && opt.value !== 'tapped-hole';
              return (
                <button
                  key={opt.value}
                  disabled={disabled}
                  className="flex flex-col items-center justify-center gap-3 min-h-[132px] px-4 py-4 rounded-[12px] text-sm font-medium transition-colors border"
                  style={
                    disabled
                      ? { color: '#9ca3af', borderColor: 'var(--line)', backgroundColor: '#f8fafc', cursor: 'not-allowed', opacity: 0.65 }
                      : assemblyType === opt.value
                        ? { background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: '#ffffff', boxShadow: '0 1px 3px var(--shadow)', borderColor: 'transparent' }
                        : { color: 'var(--ink)', borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }
                  }
                  onClick={() => !disabled && setAssemblyType(opt.value)}
                >
                  <span className="leading-none" aria-hidden="true"><AssemblyModeIcon mode={opt.value} active={!disabled && assemblyType === opt.value} /></span>
                  <span className="text-[13px] font-semibold leading-tight text-center">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input mode selector */}
          <div className="flex rounded-[10px] p-1 mb-4" style={{ backgroundColor: '#eeeeee' }}>
            {(['utilization', 'torque', 'preload'] as const).map((m) => (
              <button
                key={m}
                className="flex-1 px-2 py-1.5 rounded-[8px] text-xs font-semibold transition-colors"
                style={
                  inputMode === m
                    ? { background: 'var(--panel)', color: 'var(--ink)', boxShadow: '0 1px 3px var(--shadow)' }
                    : { color: 'var(--muted)' }
                }
                onClick={() => setInputMode(m)}
              >
                {m === 'utilization' ? 'Torque %' : m === 'torque' ? 'Torque' : 'Preload'}
              </button>
            ))}
          </div>

          {/* Conditional input based on mode */}
          {inputMode === 'utilization' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                Torque Level [%]
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="brand-range flex-1 cursor-pointer"
                  value={utilization}
                  onChange={(e) => setUtilization(snapPercent(parseInt(e.target.value)))}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  className="w-20 px-3 py-2 text-lg font-mono text-center bg-white border rounded-[10px] focus:outline-none focus:ring-2"
                  style={{
                    borderColor: utilization > 100 ? 'var(--danger)' : 'var(--line)',
                    '--tw-ring-color': 'var(--brand)'
                  } as React.CSSProperties}
                  value={utilization}
                  onChange={(e) => setUtilization(snapPercent(parseFloat(e.target.value) || 0))}
                />
              </div>
            </div>
          )}

          {inputMode === 'torque' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                Tightening Torque [{useImperial ? 'lb·ft' : 'N·m'}]
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                className={inputClass}
                style={selectStyle}
                value={torqueInput || ''}
                onChange={(e) => setTorqueInput(parseFloat(e.target.value) || 0)}
                placeholder={useImperial ? 'e.g. 25 lb·ft' : 'e.g. 30 N·m'}
              />
            </div>
          )}

          {inputMode === 'preload' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                Target Preload [{useImperial ? 'lbf' : 'N'}]
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className={inputClass}
                style={selectStyle}
                value={preloadInput || ''}
                onChange={(e) => setPreloadInput(parseFloat(e.target.value) || 0)}
                placeholder={useImperial ? 'e.g. 5000 lbf' : 'e.g. 25000 N'}
              />
            </div>
          )}

          {/* Screw selector */}
          <div className="mb-4">
            <ScrewSelector value={screw} onChange={handleScrewChange} />
          </div>

          {/* Washer under head */}
          {canUseHeadWasher ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                Washer Under Head
              </label>
              <select
                className={selectClass}
                style={selectStyle}
                value={headWasherIdx}
                onChange={(e) => setHeadWasherIdx(parseInt(e.target.value))}
              >
                <option value={-1}>None</option>
                {matchingWashers.map((w, i) => (
                  <option key={`hw-${i}`} value={i}>
                    {formatWasher(w)}
                  </option>
                ))}
              </select>
            </div>
          ) : screw?.isCountersunk ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                Washer Under Head
              </label>
              <div className="px-3 py-2 text-sm rounded-[10px] border" style={{ color: 'var(--muted)', borderColor: 'var(--line)', backgroundColor: '#f8fafc' }}>
                Not used with countersunk screws
              </div>
            </div>
          ) : screw && !screw.hasHead ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                Washer Under Head
              </label>
              <div className="px-3 py-2 text-sm rounded-[10px] border" style={{ color: 'var(--muted)', borderColor: 'var(--line)', backgroundColor: '#f8fafc' }}>
                Not applicable for set screws
              </div>
            </div>
          ) : null}

          {/* Clamped material */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
              Top Part
            </label>
            <MaterialSelector value={clampedMaterial} onChange={setClampedMaterial} />
          </div>

          {/* Tapped / Bottom material */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
              {assemblyType === 'through-nut' ? 'Bottom Part' : 'Threaded Part'}
            </label>
            <MaterialSelector value={tappedMaterial} onChange={setTappedMaterial} />
          </div>

          {/* Nut selector — only for through-nut */}
          {assemblyType === 'through-nut' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                Nut
              </label>
              <select
                className={selectClass}
                style={selectStyle}
                value={nutIdx}
                onChange={(e) => setNutIdx(parseInt(e.target.value))}
              >
                {matchingNuts.length === 0 && (
                  <option value={0}>Select a screw first</option>
                )}
                {matchingNuts.map((n, i) => (
                  <option key={`nut-${i}`} value={i}>
                    {formatNut(n)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Washer under nut — only for through-nut */}
          {assemblyType === 'through-nut' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                Washer Under Nut
              </label>
              <select
                className={selectClass}
                style={selectStyle}
                value={nutWasherIdx}
                onChange={(e) => setNutWasherIdx(parseInt(e.target.value))}
              >
                <option value={-1}>None</option>
                {matchingWashers.map((w, i) => (
                  <option key={`nw-${i}`} value={i}>
                    {formatWasher(w)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Standoff length — only for standoff */}
          {assemblyType === 'standoff' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                Standoff Body Length [mm]
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                className={inputClass}
                style={selectStyle}
                value={standoffLength || ''}
                onChange={(e) => setStandoffLength(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 10"
              />
            </div>
          )}

          {/* Bolt grade */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Bolt Grade</label>
            <select
              className={selectClass}
              style={selectStyle}
              value={gradeIdx}
              onChange={(e) => setGradeIdx(parseInt(e.target.value))}
            >
              {boltGrades.map((g, i) => (
                <option key={g.name} value={i}>{g.name} (Rp₀.₂ = {g.Rp02} MPa)</option>
              ))}
            </select>
          </div>

          {/* Friction pair */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Friction Pair</label>
            <select
              className={selectClass}
              style={selectStyle}
              value={frictionIdx}
              onChange={(e) => { setFrictionIdx(parseInt(e.target.value)); setCustomFriction(null); }}
            >
              {frictionDatabase.map((f, i) => (
                <option key={i} value={i}>{`${f.name} (${f.condition})`}</option>
              ))}
            </select>
            <div className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
              Thread friction: {friction.muThread.toFixed(2)} · Head / nut friction: {friction.muHead.toFixed(2)}
            </div>
          </div>

          <details className="mb-4 rounded-[10px] border" style={{ borderColor: 'var(--line)', backgroundColor: '#fafafa' }}>
            <summary className="px-3 py-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
              Advanced friction settings
            </summary>
            <div className="px-3 pb-3 pt-1 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Thread friction</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1"
                  className={smallInputClass}
                  style={selectStyle}
                  value={friction.muThread}
                  onChange={(e) => setCustomFriction({ ...friction, muThread: Math.max(0.01, parseFloat(e.target.value) || 0.01) })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Head / nut friction</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1"
                  className={smallInputClass}
                  style={selectStyle}
                  value={friction.muHead}
                  onChange={(e) => setCustomFriction({ ...friction, muHead: Math.max(0.01, parseFloat(e.target.value) || 0.01) })}
                />
              </div>
            </div>
          </details>

          {/* Engagement length & clamp length */}
          <div className={`grid gap-3 mb-4 ${assemblyType === 'through-nut' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {assemblyType !== 'through-nut' && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Thread Engagement [mm]</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  className={inputClass}
                  style={selectStyle}
                  value={engagementLength || ''}
                  onChange={(e) => setEngagementLength(parseFloat(e.target.value) || 0)}
                />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Default: 1.5 × d</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Clamp Length [mm]</label>
              <input
                type="number"
                step="0.1"
                min="1"
                className={inputClass}
                style={selectStyle}
                value={clampLength || ''}
                onChange={(e) => {
                  const nextClampLength = parseFloat(e.target.value) || 0;
                  setClampLength(nextClampLength);
                  setClampLengthSplit((prev) => {
                    if (prev === 0 || prev === clampLength || prev > nextClampLength) {
                      return nextClampLength;
                    }
                    return prev;
                  });
                }}
              />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Default: 2 × d</span>
            </div>
          </div>

          {tappedMaterial && clampLength > 0 && (
            <details className="mb-4 rounded-[10px] border" style={{ borderColor: 'var(--line)', backgroundColor: '#fafafa' }}>
              <summary className="px-3 py-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
                Advanced stiffness settings
              </summary>
              <div className="px-3 pb-3 pt-1">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                  Top part share of clamp length [mm]
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={clampLength}
                  className={inputClass}
                  style={selectStyle}
                  value={clampLengthSplit}
                  onChange={(e) => {
                    const nextSplit = parseFloat(e.target.value) || 0;
                    setClampLengthSplit(Math.min(Math.max(0, nextSplit), clampLength));
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Only used for the stiffness model when top and bottom parts have different materials.
                </p>
              </div>
            </details>
          )}

          {/* Unit toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: 'var(--muted)' }}>Units:</label>
            <button
              className="px-3 py-1 rounded-[10px] text-sm font-medium transition-colors"
              style={
                !useImperial
                  ? { background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: '#ffffff' }
                  : { color: 'var(--muted)' }
              }
              onClick={() => setUseImperial(false)}
            >
              Metric (N, N&middot;m)
            </button>
            <button
              className="px-3 py-1 rounded-[10px] text-sm font-medium transition-colors"
              style={
                useImperial
                  ? { background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: '#ffffff' }
                  : { color: 'var(--muted)' }
              }
              onClick={() => setUseImperial(true)}
            >
              Imperial (lbf, lb&middot;ft)
            </button>
          </div>
        </div>
      </div>

      {/* Main: primary output area */}
      <div className="flex-1 min-w-0 space-y-4">
        <AssemblyDiagram
          screw={screw}
          clampedMaterial={clampedMaterial}
          tappedMaterial={tappedMaterial}
          clampLength={clampLength}
          engagementLength={engagementLength}
          assemblyType={assemblyType}
          headWasher={headWasher}
          nutWasher={nutWasher}
          nut={nut}
          standoffLength={standoffLength}
        />
        <Results
          inputMode={inputMode}
          utilization={utilization}
          preload={preload}
          torque={torque}
          screw={screw}
          clampedMaterial={clampedMaterial}
          tappedMaterial={tappedMaterial}
          friction={friction}
          grade={grade}
          engagementLength={engagementLength}
          clampLength={clampLength}
          clampLengthSplit={clampLengthSplit}
          useImperial={useImperial}
          assemblyType={assemblyType}
          headWasher={headWasher}
          nutWasher={nutWasher}
          nut={nut}
          bearingOD={effectiveBearingOD}
          bearingID={effectiveBearingID}
        />
        <JointDiagram
          preload={preload}
          screw={screw}
          material={clampedMaterial}
          clampLength={clampLength}
          clampLengthSplit={clampLengthSplit}
          gradeName={grade.name}
          secondMaterial={tappedMaterial}
        />
      </div>
    </div>
  );
}
