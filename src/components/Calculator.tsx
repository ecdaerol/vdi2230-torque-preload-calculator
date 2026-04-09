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
import { boltGrades, BoltGrade, calculatePreload, calculateTorque } from '../calc/torque';

const assemblyOptions: { value: AssemblyType; label: string; icon: string }[] = [
  {
    value: 'tapped-hole',
    label: 'Into Tapped Hole',
    icon: '\u2193\u25A0', // arrow into block
  },
  {
    value: 'through-nut',
    label: 'Through + Nut',
    icon: '\u2195\u2B21', // bolt through with nut
  },
  {
    value: 'standoff',
    label: 'Through Standoff',
    icon: '\u2195\u25AF', // bolt through spacer
  },
];

export default function Calculator() {
  // --- Core state ---
  const [mode, setMode] = useState<'torque-to-preload' | 'preload-to-torque'>('torque-to-preload');
  const [inputValue, setInputValue] = useState<number>(0);
  const [screw, setScrew] = useState<ScrewData | null>(null);
  const [clampedMaterial, setClampedMaterial] = useState<MaterialData | null>(null);
  const [tappedMaterial, setTappedMaterial] = useState<MaterialData | null>(null);
  const [frictionIdx, setFrictionIdx] = useState(0);
  const [customFriction, setCustomFriction] = useState<FrictionPair | null>(null);
  const [gradeIdx, setGradeIdx] = useState(0);
  const [engagementLength, setEngagementLength] = useState(0);
  const [clampLength, setClampLength] = useState(0);
  const [useImperial, setUseImperial] = useState(false);

  // --- New assembly state ---
  const [assemblyType, setAssemblyType] = useState<AssemblyType>('tapped-hole');
  const [headWasherIdx, setHeadWasherIdx] = useState<number>(-1); // -1 = none
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

  // Reset washer/nut indices when screw changes and they go out of range
  const handleScrewChange = useCallback((s: ScrewData) => {
    setScrew(s);
    if (engagementLength === 0 || engagementLength === (screw?.d ?? 0) * 1.5) {
      setEngagementLength(parseFloat((s.d * 1.5).toFixed(1)));
    }
    if (clampLength === 0 || clampLength === (screw?.d ?? 0) * 2) {
      setClampLength(parseFloat((s.d * 2).toFixed(1)));
    }
    // Reset washer/nut selections when screw size changes
    if (s.size !== screw?.size) {
      setHeadWasherIdx(-1);
      setNutWasherIdx(-1);
      setNutIdx(0);
    }
  }, [engagementLength, clampLength, screw]);

  // Compute preload for the diagram
  let preload = 0;
  if (screw && inputValue > 0) {
    if (mode === 'torque-to-preload') {
      preload = calculatePreload(inputValue, screw, friction);
    } else {
      preload = inputValue;
    }
  }

  // --- Shared CSS classes ---
  const selectClass =
    'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const inputClass =
    'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500';
  const smallInputClass =
    'w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm font-mono';

  // Format a washer option label
  const formatWasher = (w: WasherData): string =>
    `${w.standard} ${w.type} \u2014 \u2300${w.outerDiameter.toFixed(1)} \u00D7 ${w.thickness.toFixed(1)}mm`;

  // Format a nut option label
  const formatNut = (n: NutData): string =>
    `${n.standard} ${n.type} \u2014 AF ${n.width.toFixed(1)} \u00D7 H ${n.height.toFixed(1)}mm`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Inputs */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Input Parameters</h3>

          {/* Assembly type toggle */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1 mb-4">
            {assemblyOptions.map((opt) => (
              <button
                key={opt.value}
                className={`flex-1 px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  assemblyType === opt.value
                    ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                onClick={() => setAssemblyType(opt.value)}
              >
                <span className="mr-1">{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1 mb-4">
            <button
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'torque-to-preload'
                  ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              onClick={() => { setMode('torque-to-preload'); setInputValue(0); }}
            >
              Torque &rarr; Preload
            </button>
            <button
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'preload-to-torque'
                  ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              onClick={() => { setMode('preload-to-torque'); setInputValue(0); }}
            >
              Preload &rarr; Torque
            </button>
          </div>

          {/* Input value */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              {mode === 'torque-to-preload'
                ? `Tightening Torque [${useImperial ? 'lb\u00B7ft' : 'N\u00B7m'}]`
                : `Target Preload [${useImperial ? 'lbf' : 'N'}]`}
            </label>
            <input
              type="number"
              step="any"
              min="0"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={inputValue || ''}
              onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
              placeholder={mode === 'torque-to-preload' ? 'e.g. 2.5' : 'e.g. 5000'}
            />
          </div>

          {/* Screw selector */}
          <div className="mb-4">
            <ScrewSelector value={screw} onChange={handleScrewChange} />
          </div>

          {/* Washer under head */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Washer Under Head
            </label>
            <select
              className={selectClass}
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

          {/* Clamped material */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Clamped Part (through-hole)
              </label>
            </div>
            <MaterialSelector value={clampedMaterial} onChange={setClampedMaterial} />
          </div>

          {/* Tapped / Bottom material — always shown, label varies */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {assemblyType === 'through-nut'
                  ? 'Bottom Part (through-hole)'
                  : 'Tapped Part (threaded)'}
              </label>
            </div>
            <MaterialSelector value={tappedMaterial} onChange={setTappedMaterial} />
          </div>

          {/* Nut selector — only for through-nut */}
          {assemblyType === 'through-nut' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                Nut
              </label>
              <select
                className={selectClass}
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
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                Washer Under Nut
              </label>
              <select
                className={selectClass}
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
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                Standoff Length [mm]
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                className={inputClass}
                value={standoffLength || ''}
                onChange={(e) => setStandoffLength(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 10"
              />
            </div>
          )}

          {/* Bolt grade */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Bolt Grade</label>
            <select
              className={selectClass}
              value={gradeIdx}
              onChange={(e) => setGradeIdx(parseInt(e.target.value))}
            >
              {boltGrades.map((g, i) => (
                <option key={g.name} value={i}>{g.name} (Rp0.2 = {g.proofStress} MPa)</option>
              ))}
            </select>
          </div>

          {/* Friction pair */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Friction Pair</label>
            <select
              className={selectClass}
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
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">&mu;_thread (override)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className={smallInputClass}
                value={friction.muThread}
                onChange={(e) => setCustomFriction({ ...friction, muThread: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">&mu;_head (override)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                className={smallInputClass}
                value={friction.muHead}
                onChange={(e) => setCustomFriction({ ...friction, muHead: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Engagement length & clamp length */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Thread Engagement [mm]</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className={inputClass}
                value={engagementLength || ''}
                onChange={(e) => setEngagementLength(parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs text-slate-400">Default: 1.5 &times; d</span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Clamp Length [mm]</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className={inputClass}
                value={clampLength || ''}
                onChange={(e) => setClampLength(parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs text-slate-400">Default: 2 &times; d</span>
            </div>
          </div>

          {/* Unit toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">Units:</label>
            <button
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${!useImperial ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}
              onClick={() => setUseImperial(false)}
            >
              Metric (N, N&middot;m)
            </button>
            <button
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${useImperial ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}
              onClick={() => setUseImperial(true)}
            >
              Imperial (lbf, lb&middot;ft)
            </button>
          </div>
        </div>
      </div>

      {/* Right: Results + Diagrams */}
      <div className="space-y-4">
        <Results
          mode={mode}
          inputValue={inputValue}
          screw={screw}
          clampedMaterial={clampedMaterial}
          tappedMaterial={tappedMaterial}
          friction={friction}
          grade={grade}
          engagementLength={engagementLength}
          clampLength={clampLength}
          useImperial={useImperial}
          assemblyType={assemblyType}
          headWasher={headWasher}
          nutWasher={nutWasher}
          nut={nut}
        />
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
        <JointDiagram
          preload={preload}
          screw={screw}
          material={clampedMaterial}
          clampLength={clampLength}
        />
      </div>
    </div>
  );
}
