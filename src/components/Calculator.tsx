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
import { boltGrades, BoltGrade, calculateTorque, calculatePreload } from '../calc/torque';

const assemblyOptions: { value: AssemblyType; label: string; icon: string }[] = [
  {
    value: 'tapped-hole',
    label: 'Into Tapped Hole',
    icon: '\u2193\u25A0',
  },
  {
    value: 'through-nut',
    label: 'Through + Nut',
    icon: '\u2195\u2B21',
  },
  {
    value: 'standoff',
    label: 'Through Standoff',
    icon: '\u2195\u25AF',
  },
];

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

  const headWasher: WasherData | null =
    headWasherIdx >= 0 && headWasherIdx < matchingWashers.length
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

  // --- Screw-type-specific UI flags ---
  const isSetScrew = screw ? !screw.hasHead : false;
  const isCountersunk = screw?.isCountersunk ?? false;
  // Washer under head makes no sense for countersunk or headless screws
  const showHeadWasher = !isSetScrew && !isCountersunk;
  // Set screws can only be tapped-hole — no through-nut or standoff
  const effectiveAssemblyType = isSetScrew ? 'tapped-hole' as AssemblyType : assemblyType;

  // Reset washer/nut indices when screw changes
  const handleScrewChange = useCallback((s: ScrewData) => {
    setScrew(s);
    if (engagementLength === 0 || engagementLength === (screw?.d ?? 0) * 1.5) {
      setEngagementLength(parseFloat((s.d * 1.5).toFixed(1)));
    }
    if (clampLength === 0 || clampLength === (screw?.d ?? 0) * 2) {
      setClampLength(parseFloat((s.d * 2).toFixed(1)));
    }
    if (s.size !== screw?.size) {
      setHeadWasherIdx(-1);
      setNutWasherIdx(-1);
      setNutIdx(0);
    }
    // Clear head washer if switching to countersunk or set screw
    if (s.isCountersunk || !s.hasHead) {
      setHeadWasherIdx(-1);
    }
    // Force tapped-hole for set screws
    if (!s.hasHead) {
      setAssemblyType('tapped-hole');
    }
  }, [engagementLength, clampLength, screw]);

  // Determine actual tightening-side bearing geometry.
  // For tapped-hole / standoff: tightened from head side → use head washer if present.
  // For through-nut: tightened from nut side → use nut (or nut washer) bearing surface.
  let bearingOD: number | undefined;
  let bearingID: number | undefined;
  if (assemblyType === 'through-nut' && nut && screw) {
    bearingOD = nutWasher ? nutWasher.outerDiameter : nut.bearingDiameter;
    bearingID = nutWasher ? nutWasher.innerDiameter : screw.holeDiameter;
  } else if (headWasher) {
    bearingOD = headWasher.outerDiameter;
    bearingID = headWasher.innerDiameter;
  }

  // Compute preload and torque based on input mode.
  // Imperial inputs must be converted to metric before calculation.
  const NM_PER_LBFT = 1.355818;  // 1 lb·ft = 1.3558 N·m
  const N_PER_LBF = 4.44822;     // 1 lbf = 4.4482 N

  let preload = 0;
  let torque = 0;
  if (screw) {
    if (inputMode === 'utilization' && utilization > 0) {
      preload = (utilization / 100) * grade.Rp02 * screw.stressArea;
      torque = calculateTorque(preload, screw, friction, bearingOD, bearingID);
    } else if (inputMode === 'torque' && torqueInput > 0) {
      const torqueMetric = useImperial ? torqueInput * NM_PER_LBFT : torqueInput;
      torque = torqueMetric;
      preload = calculatePreload(torqueMetric, screw, friction, bearingOD, bearingID);
    } else if (inputMode === 'preload' && preloadInput > 0) {
      const preloadMetric = useImperial ? preloadInput * N_PER_LBF : preloadInput;
      preload = preloadMetric;
      torque = calculateTorque(preloadMetric, screw, friction, bearingOD, bearingID);
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
    `${w.standard} ${w.type} \u2014 \u2300${w.outerDiameter.toFixed(1)} \u00D7 ${w.thickness.toFixed(1)}mm`;

  // Format a nut option label
  const formatNut = (n: NutData): string =>
    `${n.standard} ${n.type} \u2014 AF ${n.width.toFixed(1)} \u00D7 H ${n.height.toFixed(1)}mm`;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar: fixed 420px on desktop, full width on mobile */}
      <div className="w-full lg:w-[420px] lg:flex-shrink-0 space-y-4">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Input Parameters</h3>

          {/* Assembly type toggle — disabled for set screws (always tapped-hole) */}
          <div className="flex rounded-[10px] p-1 mb-4" style={{ backgroundColor: '#eeeeee', opacity: isSetScrew ? 0.5 : 1 }}>
            {assemblyOptions.map((opt) => (
              <button
                key={opt.value}
                disabled={isSetScrew}
                className="flex-1 px-2 py-2 rounded-[8px] text-sm font-medium transition-colors"
                style={
                  effectiveAssemblyType === opt.value
                    ? { background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: '#ffffff', boxShadow: '0 1px 3px var(--shadow)' }
                    : { color: 'var(--muted)' }
                }
                onClick={() => !isSetScrew && setAssemblyType(opt.value)}
              >
                <span className="mr-1">{opt.icon}</span> {opt.label}
              </button>
            ))}
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
                {m === 'utilization' ? 'Utilization %' : m === 'torque' ? 'Torque → F' : 'Force → T'}
              </button>
            ))}
          </div>

          {/* Conditional input based on mode */}
          {inputMode === 'utilization' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                Target Axial Utilization [%]
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--brand)' }}
                  value={utilization}
                  onChange={(e) => setUtilization(parseInt(e.target.value))}
                />
                <input
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  className="w-20 px-3 py-2 text-lg font-mono text-center bg-white border rounded-[10px] focus:outline-none focus:ring-2"
                  style={{
                    borderColor: utilization > 100 ? 'var(--danger)' : 'var(--line)',
                    '--tw-ring-color': 'var(--brand)'
                  } as React.CSSProperties}
                  value={utilization}
                  onChange={(e) => setUtilization(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Axial preload as % of proof load. Von Mises stress (incl. torsion) will be ~10-20% higher.</p>
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
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Enter applied torque; preload will be calculated.</p>
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
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Enter desired preload; torque will be calculated.</p>
            </div>
          )}

          {/* Screw selector */}
          <div className="mb-4">
            <ScrewSelector value={screw} onChange={handleScrewChange} />
          </div>

          {/* Washer under head — hidden for countersunk (conical seat) and set screws (no head) */}
          {showHeadWasher && (
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
          )}

          {/* Clamped material — hidden for set screws (no clamped joint) */}
          {!isSetScrew && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--brand)' }}></div>
                <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  Clamped Part (through-hole)
                </label>
              </div>
              <MaterialSelector value={clampedMaterial} onChange={setClampedMaterial} />
            </div>
          )}

          {/* Tapped / Bottom material */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--warn)' }}></div>
              <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                {effectiveAssemblyType === 'through-nut'
                  ? 'Bottom Part (through-hole)'
                  : 'Tapped Part (threaded)'}
              </label>
            </div>
            <MaterialSelector value={tappedMaterial} onChange={setTappedMaterial} />
          </div>

          {/* Nut selector — only for through-nut */}
          {effectiveAssemblyType === 'through-nut' && (
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
          {effectiveAssemblyType === 'through-nut' && (
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
          {effectiveAssemblyType === 'standoff' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                Standoff Length [mm]
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
                <option key={g.name} value={i}>{g.name} (Rp0.2 = {g.Rp02} MPa)</option>
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
                <option key={i} value={i}>{f.name} ({f.condition}) &mdash; &mu;_th={f.muThread}, &mu;_h={f.muHead}</option>
              ))}
            </select>
          </div>

          {/* Manual friction override */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>&mu;_thread (override)</label>
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
              <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>&mu;_head (override)</label>
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

          {/* Engagement length & clamp length */}
          <div className={`grid ${isSetScrew ? 'grid-cols-1' : 'grid-cols-2'} gap-3 mb-4`}>
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
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Default: 1.5 &times; d</span>
            </div>
            {/* Clamp length — hidden for set screws (no clamped joint) */}
            {!isSetScrew && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Clamp Length [mm]</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  className={inputClass}
                  style={selectStyle}
                  value={clampLength || ''}
                  onChange={(e) => setClampLength(parseFloat(e.target.value) || 0)}
                />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Default: 2 &times; d</span>
              </div>
            )}
          </div>

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

      {/* Main: scrollable results area */}
      <div className="flex-1 min-w-0 space-y-4">
        <Results
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
          useImperial={useImperial}
          assemblyType={effectiveAssemblyType}
          headWasher={showHeadWasher ? headWasher : null}
          nutWasher={nutWasher}
          nut={nut}
          bearingOD={bearingOD}
          bearingID={bearingID}
        />
        <AssemblyDiagram
          screw={screw}
          clampedMaterial={isSetScrew ? null : clampedMaterial}
          tappedMaterial={tappedMaterial}
          clampLength={clampLength}
          engagementLength={engagementLength}
          assemblyType={effectiveAssemblyType}
          headWasher={headWasher}
          nutWasher={nutWasher}
          nut={nut}
          standoffLength={standoffLength}
        />
        <JointDiagram
          preload={preload}
          screw={screw}
          material={clampedMaterial}
          clampLength={clampLength}
          gradeName={grade.name}
        />
      </div>
    </div>
  );
}
