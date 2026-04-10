import { useCallback, useMemo, useState } from 'react';
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
import { ReceiverPreset, receiverPresets } from '../data/receivers';
import { boltGrades, calculateTorque, calculatePreload } from '../calc/torque';
import { tighteningMethods } from '../calc/preloadRealism';

const NM_PER_LBFT = 1.355818;
const N_PER_LBF = 4.44822;

const assemblyOptions: { value: AssemblyType; label: string }[] = [
  { value: 'tapped-hole', label: 'Tapped Hole' },
  { value: 'through-nut', label: 'Nut & Bolt' },
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

}

export default function Calculator() {
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

  const [assemblyType, setAssemblyType] = useState<AssemblyType>('tapped-hole');
  const [headWasherIdx, setHeadWasherIdx] = useState<number>(-1);
  const [nutWasherIdx, setNutWasherIdx] = useState<number>(-1);
  const [nutIdx, setNutIdx] = useState<number>(0);

  const [tighteningMethodIdx, setTighteningMethodIdx] = useState(1);
  const [relaxationLossPct, setRelaxationLossPct] = useState(5);
  const [settlementMicrons, setSettlementMicrons] = useState(0);

  const [receiverPresetIdx, setReceiverPresetIdx] = useState(0);
  const [axialLoadInput, setAxialLoadInput] = useState(0);
  const [shearLoadInput, setShearLoadInput] = useState(0);
  const [slipFriction, setSlipFriction] = useState(0.15);

  const friction = customFriction ?? frictionDatabase[frictionIdx];
  const grade = boltGrades[gradeIdx];
  const tighteningMethod = tighteningMethods[tighteningMethodIdx];
  const receiverPreset: ReceiverPreset = receiverPresets[receiverPresetIdx];

  const frictionGroups = useMemo(() => {
    const groups = new Map<string, { item: FrictionPair; index: number }[]>();
    frictionDatabase.forEach((item, index) => {
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group)!.push({ item, index });
    });
    return Array.from(groups.entries());
  }, []);

  const matchingWashers = useMemo(
    () => (screw ? washerDatabase.filter((washer) => washer.size === screw.size).sort((a, b) => a.outerDiameter - b.outerDiameter) : []),
    [screw],
  );
  const matchingNuts = useMemo(
    () => (screw ? nutDatabase.filter((nut) => nut.size === screw.size).sort((a, b) => a.bearingDiameter - b.bearingDiameter) : []),
    [screw],
  );

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

  const handleScrewChange = useCallback((nextScrew: ScrewData) => {
    setScrew(nextScrew);
    if (engagementLength === 0 || engagementLength === (screw?.d ?? 0) * 1.5) {
      setEngagementLength(parseFloat((nextScrew.d * 1.5).toFixed(1)));
    }
    if (clampLength === 0 || clampLength === (screw?.d ?? 0) * 2) {
      const nextClampLength = parseFloat((nextScrew.d * 2).toFixed(1));
      setClampLength(nextClampLength);
      setClampLengthSplit(nextClampLength);
    }
    if (nextScrew.size !== screw?.size) {
      setHeadWasherIdx(-1);
      setNutWasherIdx(-1);
      setNutIdx(0);
    }
    if (!nextScrew.hasHead || nextScrew.isCountersunk) {
      setHeadWasherIdx(-1);
    }
    if (!nextScrew.hasHead && assemblyType !== 'tapped-hole') {
      setAssemblyType('tapped-hole');
    }
  }, [assemblyType, clampLength, engagementLength, screw]);

  const snapPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value / 5) * 5));

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

  const axialServiceLoad = useImperial ? axialLoadInput * N_PER_LBF : axialLoadInput;
  const shearServiceLoad = useImperial ? shearLoadInput * N_PER_LBF : shearLoadInput;

  const selectClass = 'w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-[var(--panel)] border rounded-[10px]';
  const selectStyle: React.CSSProperties = { borderColor: 'var(--line)' };
  const inputClass = 'w-full px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 bg-[var(--panel)] border rounded-[10px]';
  const smallInputClass = 'w-full px-2 py-1 text-sm font-mono bg-[var(--panel)] border rounded-[10px]';

  const formatWasher = (washer: WasherData): string =>
    `${washer.standard} ${washer.type} — Ø${washer.outerDiameter.toFixed(1)} × ${washer.thickness.toFixed(1)} mm`;

  const formatNut = (item: NutData): string =>
    `${item.standard} ${item.type} — AF ${item.width.toFixed(1)} × H ${item.height.toFixed(1)} mm`;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-[440px] lg:flex-shrink-0 space-y-4">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Input Parameters</h3>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {assemblyOptions.map((option) => {
              const disabled = setScrewOnlyModes && option.value !== 'tapped-hole';
              return (
                <button
                  key={option.value}
                  disabled={disabled}
                  className="flex flex-col items-center justify-center gap-3 min-h-[132px] px-4 py-4 rounded-[12px] text-sm font-medium transition-colors border"
                  style={
                    disabled
                      ? { color: '#9ca3af', borderColor: 'var(--line)', backgroundColor: 'var(--panel)', cursor: 'not-allowed', opacity: 0.65 }
                      : assemblyType === option.value
                        ? { background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: '#ffffff', boxShadow: '0 1px 3px var(--shadow)', borderColor: 'transparent' }
                        : { color: 'var(--ink)', borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }
                  }
                  onClick={() => !disabled && setAssemblyType(option.value)}
                >
                  <span className="leading-none" aria-hidden="true"><AssemblyModeIcon mode={option.value} active={!disabled && assemblyType === option.value} /></span>
                  <span className="text-[13px] font-semibold leading-tight text-center">{option.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex rounded-[10px] p-1 mb-4" style={{ backgroundColor: 'var(--line)' }}>
            {(['utilization', 'torque', 'preload'] as const).map((mode) => (
              <button
                key={mode}
                className="flex-1 px-2 py-1.5 rounded-[8px] text-xs font-semibold transition-colors"
                style={
                  inputMode === mode
                    ? { background: 'var(--panel)', color: 'var(--ink)', boxShadow: '0 1px 3px var(--shadow)' }
                    : { color: 'var(--muted)' }
                }
                onClick={() => setInputMode(mode)}
              >
                {mode === 'utilization' ? 'Torque %' : mode === 'torque' ? 'Torque' : 'Preload'}
              </button>
            ))}
          </div>

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
                  onChange={(event) => setUtilization(snapPercent(parseInt(event.target.value)))}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  className="w-20 px-3 py-2 text-lg font-mono text-center bg-[var(--panel)] border rounded-[10px] focus:outline-none focus:ring-2"
                  style={{ borderColor: utilization > 100 ? 'var(--danger)' : 'var(--line)', '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
                  value={utilization}
                  onChange={(event) => setUtilization(snapPercent(parseFloat(event.target.value) || 0))}
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
                onChange={(event) => setTorqueInput(parseFloat(event.target.value) || 0)}
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
                onChange={(event) => setPreloadInput(parseFloat(event.target.value) || 0)}
                placeholder={useImperial ? 'e.g. 5000 lbf' : 'e.g. 25000 N'}
              />
            </div>
          )}

          <div className="mb-4">
            <ScrewSelector value={screw} onChange={handleScrewChange} />
          </div>

          {canUseHeadWasher ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                Washer Under Head
              </label>
              <select className={selectClass} style={selectStyle} value={headWasherIdx} onChange={(event) => setHeadWasherIdx(parseInt(event.target.value))}>
                <option value={-1}>None</option>
                {matchingWashers.map((washer, index) => (
                  <option key={`hw-${index}`} value={index}>{formatWasher(washer)}</option>
                ))}
              </select>
            </div>
          ) : screw?.isCountersunk ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Washer Under Head</label>
              <div className="px-3 py-2 text-sm rounded-[10px] border" style={{ color: 'var(--muted)', borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }}>
                Not used with countersunk screws
              </div>
            </div>
          ) : screw && !screw.hasHead ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Washer Under Head</label>
              <div className="px-3 py-2 text-sm rounded-[10px] border" style={{ color: 'var(--muted)', borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }}>
                Not applicable for set screws
              </div>
            </div>
          ) : null}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Top Part</label>
            <MaterialSelector value={clampedMaterial} onChange={setClampedMaterial} />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
              {assemblyType === 'through-nut' ? 'Bottom Part' : 'Threaded Part'}
            </label>
            <MaterialSelector value={tappedMaterial} onChange={setTappedMaterial} />
          </div>

          {assemblyType === 'through-nut' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Nut</label>
                <select className={selectClass} style={selectStyle} value={nutIdx} onChange={(event) => setNutIdx(parseInt(event.target.value))}>
                  {matchingNuts.length === 0 && <option value={0}>Select a screw first</option>}
                  {matchingNuts.map((item, index) => (
                    <option key={`nut-${index}`} value={index}>{formatNut(item)}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Washer Under Nut</label>
                <select className={selectClass} style={selectStyle} value={nutWasherIdx} onChange={(event) => setNutWasherIdx(parseInt(event.target.value))}>
                  <option value={-1}>None</option>
                  {matchingWashers.map((washer, index) => (
                    <option key={`nw-${index}`} value={index}>{formatWasher(washer)}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Bolt Grade</label>
            <select className={selectClass} style={selectStyle} value={gradeIdx} onChange={(event) => setGradeIdx(parseInt(event.target.value))}>
              {boltGrades.map((item, index) => (
                <option key={item.name} value={index}>{item.name} (Rp₀.₂ = {item.Rp02} MPa)</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Interface Condition</label>
            <select
              className={selectClass}
              style={selectStyle}
              value={frictionIdx}
              onChange={(event) => {
                setFrictionIdx(parseInt(event.target.value));
                setCustomFriction(null);
              }}
            >
              {frictionGroups.map(([group, entries]) => (
                <optgroup key={group} label={group}>
                  {entries.map(({ item, index }) => (
                    <option key={`${group}-${index}`} value={index}>{`${item.name} (${item.condition})`}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="mt-2 text-xs space-y-1" style={{ color: 'var(--muted)' }}>
              <div>Thread friction: {friction.muThread.toFixed(2)} · Head / nut friction: {friction.muHead.toFixed(2)} · Preset scatter: ±{Math.round(friction.scatter * 100)}%</div>
              {friction.notes && <div>{friction.notes}</div>}
            </div>
          </div>

          <details className="mb-4 rounded-[10px] border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }}>
            <summary className="px-3 py-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
              Advanced friction settings
            </summary>
            <div className="px-3 pb-3 pt-1 grid grid-cols-3 gap-3">
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
                  onChange={(event) => setCustomFriction({ ...friction, muThread: Math.max(0.01, parseFloat(event.target.value) || 0.01) })}
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
                  onChange={(event) => setCustomFriction({ ...friction, muHead: Math.max(0.01, parseFloat(event.target.value) || 0.01) })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Preset scatter</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  className={smallInputClass}
                  style={selectStyle}
                  value={friction.scatter}
                  onChange={(event) => setCustomFriction({ ...friction, scatter: Math.max(0, parseFloat(event.target.value) || 0) })}
                />
              </div>
            </div>
          </details>

          <details className="mb-4 rounded-[10px] border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }} open>
            <summary className="px-3 py-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
              Preload realism
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Tightening method</label>
                <select className={selectClass} style={selectStyle} value={tighteningMethodIdx} onChange={(event) => setTighteningMethodIdx(parseInt(event.target.value))}>
                  {tighteningMethods.map((method, index) => (
                    <option key={method.key} value={index}>{method.label}</option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Added process scatter: ±{Math.round(tighteningMethod.processScatter * 100)}% · {tighteningMethod.notes}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Relaxation loss [%]</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    className={inputClass}
                    style={selectStyle}
                    value={relaxationLossPct}
                    onChange={(event) => setRelaxationLossPct(Math.max(0, parseFloat(event.target.value) || 0))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Settlement / embedding [μm]</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className={inputClass}
                    style={selectStyle}
                    value={settlementMicrons}
                    onChange={(event) => setSettlementMicrons(Math.max(0, parseFloat(event.target.value) || 0))}
                  />
                </div>
              </div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Use these to estimate service preload after settling, creep, or early-life preload loss.
              </p>
            </div>
          </details>

          <details className="mb-4 rounded-[10px] border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }} open>
            <summary className="px-3 py-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
              Receiver & operating loads
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-3">
              {assemblyType !== 'through-nut' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Thread receiver</label>
                  <select className={selectClass} style={selectStyle} value={receiverPresetIdx} onChange={(event) => setReceiverPresetIdx(parseInt(event.target.value))}>
                    {receiverPresets.map((preset, index) => (
                      <option key={preset.key} value={index}>{preset.label}</option>
                    ))}
                  </select>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    {receiverPreset.description} · Capacity factor ×{receiverPreset.internalCapacityFactor.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>External axial load [{useImperial ? 'lbf' : 'N'}]</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className={inputClass}
                    style={selectStyle}
                    value={axialLoadInput || ''}
                    onChange={(event) => setAxialLoadInput(Math.max(0, parseFloat(event.target.value) || 0))}
                    placeholder={useImperial ? 'e.g. 250 lbf' : 'e.g. 1200 N'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>External shear load [{useImperial ? 'lbf' : 'N'}]</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className={inputClass}
                    style={selectStyle}
                    value={shearLoadInput || ''}
                    onChange={(event) => setShearLoadInput(Math.max(0, parseFloat(event.target.value) || 0))}
                    placeholder={useImperial ? 'e.g. 120 lbf' : 'e.g. 500 N'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Slip interface friction μ</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  className={inputClass}
                  style={selectStyle}
                  value={slipFriction}
                  onChange={(event) => setSlipFriction(Math.max(0, parseFloat(event.target.value) || 0))}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Used for slip resistance under transverse load. This is separate from tightening friction.
                </p>
              </div>
            </div>
          </details>

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
                  onChange={(event) => setEngagementLength(parseFloat(event.target.value) || 0)}
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
                onChange={(event) => {
                  const nextClampLength = parseFloat(event.target.value) || 0;
                  setClampLength(nextClampLength);
                  setClampLengthSplit((previous) => {
                    if (previous === 0 || previous === clampLength || previous > nextClampLength) {
                      return nextClampLength;
                    }
                    return previous;
                  });
                }}
              />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Default: 2 × d</span>
            </div>
          </div>

          {tappedMaterial && clampLength > 0 && (
            <details className="mb-4 rounded-[10px] border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }}>
              <summary className="px-3 py-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
                Advanced stiffness settings
              </summary>
              <div className="px-3 pb-3 pt-1">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Top part share of clamp length [mm]</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={clampLength}
                  className={inputClass}
                  style={selectStyle}
                  value={clampLengthSplit}
                  onChange={(event) => {
                    const nextSplit = parseFloat(event.target.value) || 0;
                    setClampLengthSplit(Math.min(Math.max(0, nextSplit), clampLength));
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Only used for the stiffness model when top and bottom parts have different materials.
                </p>
              </div>
            </details>
          )}

          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: 'var(--muted)' }}>Units:</label>
            <button
              className="px-3 py-1 rounded-[10px] text-sm font-medium transition-colors"
              style={!useImperial ? { background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: '#ffffff' } : { color: 'var(--muted)' }}
              onClick={() => setUseImperial(false)}
            >
              Metric (N, N·m)
            </button>
            <button
              className="px-3 py-1 rounded-[10px] text-sm font-medium transition-colors"
              style={useImperial ? { background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: '#ffffff' } : { color: 'var(--muted)' }}
              onClick={() => setUseImperial(true)}
            >
              Imperial (lbf, lb·ft)
            </button>
          </div>
        </div>
      </div>

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
          tighteningMethod={tighteningMethod}
          relaxationLossPct={relaxationLossPct}
          settlementMicrons={settlementMicrons}
          receiverPreset={receiverPreset}
          axialServiceLoad={axialServiceLoad}
          shearServiceLoad={shearServiceLoad}
          slipFriction={slipFriction}
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
