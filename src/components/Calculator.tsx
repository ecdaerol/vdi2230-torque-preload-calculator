import ScrewSelector from './ScrewSelector';
import MaterialSelector from './MaterialSelector';
import Results from './Results';
import JointDiagram from './JointDiagram';
import AssemblyDiagram from './AssemblyDiagram';
import AssemblyTypeSelector from './AssemblyTypeSelector';
import InputModeSelector from './InputModeSelector';
import FrictionSection from './FrictionSection';
import PreloadRealismSection from './PreloadRealismSection';
import OperatingLoadsSection from './OperatingLoadsSection';
import { WasherData } from '../data/washers';
import { NutData } from '../data/nuts';
import { boltGrades } from '../calc/torque';
import useCalculatorState from './useCalculatorState';

const formatWasher = (w: WasherData): string =>
  `${w.standard} ${w.type} — Ø${w.outerDiameter.toFixed(1)} × ${w.thickness.toFixed(1)} mm`;

const formatNut = (n: NutData): string =>
  `${n.standard} ${n.type} — AF ${n.width.toFixed(1)} × H ${n.height.toFixed(1)} mm`;

export default function Calculator() {
  const s = useCalculatorState();
  const isStandoff = s.screw?.type.toLowerCase().includes('standoff') ?? false;

  const selectClass = 'w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-[var(--panel)] border rounded-[10px]';
  const inputClass = 'w-full px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 bg-[var(--panel)] border rounded-[10px]';
  const fieldStyle: React.CSSProperties = { borderColor: 'var(--line)' };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-[440px] lg:flex-shrink-0 space-y-4">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Input Parameters</h3>

          <AssemblyTypeSelector
            assemblyType={s.assemblyType}
            onChange={s.setAssemblyType}
            disableNutAndBolt={s.setScrewOnlyModes}
          />

          <InputModeSelector
            inputMode={s.inputMode}
            onModeChange={s.setInputMode}
            utilization={s.utilization}
            onUtilizationChange={s.setUtilization}
            torqueInput={s.torqueInput}
            onTorqueChange={s.setTorqueInput}
            preloadInput={s.preloadInput}
            onPreloadChange={s.setPreloadInput}
            useImperial={s.useImperial}
            snapPercent={s.snapPercent}
            assemblyCapacity={s.assemblyCapacity}
          />

          <div className="mb-4">
            <ScrewSelector value={s.screw} onChange={s.handleScrewChange} />
          </div>

          {!isStandoff && (s.canUseHeadWasher ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="head-washer" style={{ color: 'var(--ink)' }}>
                Washer Under Head
              </label>
              <select id="head-washer" className={selectClass} style={fieldStyle} value={s.headWasherIdx} onChange={(e) => s.setHeadWasherIdx(parseInt(e.target.value))}>
                <option value={-1}>None</option>
                {s.matchingWashers.map((w, i) => (
                  <option key={`hw-${i}`} value={i}>{formatWasher(w)}</option>
                ))}
              </select>
            </div>
          ) : s.screw?.isCountersunk ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Washer Under Head</label>
              <div className="px-3 py-2 text-sm rounded-[10px] border" style={{ color: 'var(--muted)', borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }}>
                Not used with countersunk screws
              </div>
            </div>
          ) : s.screw && !s.screw.hasHead ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Washer Under Head</label>
              <div className="px-3 py-2 text-sm rounded-[10px] border" style={{ color: 'var(--muted)', borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }}>
                Not applicable for set screws
              </div>
            </div>
          ) : null)}

          {!isStandoff && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>Top Part</label>
              <MaterialSelector id="clamped-material" value={s.clampedMaterial} onChange={s.setClampedMaterial} />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
              {s.assemblyType === 'through-nut' ? 'Bottom Part' : 'Threaded Part'}
            </label>
            <MaterialSelector id="tapped-material" value={s.tappedMaterial} onChange={s.setTappedMaterial} />
          </div>

          {s.assemblyType === 'through-nut' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="nut-select" style={{ color: 'var(--ink)' }}>Nut</label>
                <select id="nut-select" className={selectClass} style={fieldStyle} value={s.nutIdx} onChange={(e) => s.setNutIdx(parseInt(e.target.value))}>
                  {s.matchingNuts.length === 0 && <option value={0}>Select a screw first</option>}
                  {s.matchingNuts.map((item, i) => (
                    <option key={`nut-${i}`} value={i}>{formatNut(item)}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="nut-washer" style={{ color: 'var(--ink)' }}>Washer Under Nut</label>
                <select id="nut-washer" className={selectClass} style={fieldStyle} value={s.nutWasherIdx} onChange={(e) => s.setNutWasherIdx(parseInt(e.target.value))}>
                  <option value={-1}>None</option>
                  {s.matchingWashers.map((w, i) => (
                    <option key={`nw-${i}`} value={i}>{formatWasher(w)}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="turned-side" style={{ color: 'var(--ink)' }}>Turned side</label>
                <select id="turned-side" className={selectClass} style={fieldStyle} value={s.turnedSide} onChange={(e) => s.setTurnedSide(e.target.value as 'head' | 'nut')}>
                  <option value="nut">Nut (most common)</option>
                  <option value="head">Head</option>
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Bearing friction torque depends on which side rotates during tightening.
                </p>
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="bolt-grade" style={{ color: 'var(--ink)' }}>Bolt Grade</label>
            <select id="bolt-grade" className={selectClass} style={fieldStyle} value={s.gradeIdx} onChange={(e) => s.setGradeIdx(parseInt(e.target.value))}>
              {boltGrades.map((item, i) => (
                <option key={item.name} value={i}>{item.name} (Rp₀.₂ = {item.Rp02} MPa)</option>
              ))}
            </select>
          </div>

          <FrictionSection
            frictionIdx={s.frictionIdx}
            onFrictionIdxChange={s.setFrictionIdx}
            friction={s.friction}
            onCustomFrictionChange={s.setCustomFriction}
            frictionGroups={s.frictionGroups}
          />

          <PreloadRealismSection
            tighteningMethodIdx={s.tighteningMethodIdx}
            onMethodChange={s.setTighteningMethodIdx}
            tighteningMethod={s.tighteningMethod}
            relaxationLossPct={s.relaxationLossPct}
            onRelaxationChange={s.setRelaxationLossPct}
            settlementMicrons={s.settlementMicrons}
            onSettlementChange={s.setSettlementMicrons}
          />

          <OperatingLoadsSection
            assemblyType={s.assemblyType}
            receiverPresetIdx={s.receiverPresetIdx}
            onReceiverChange={s.setReceiverPresetIdx}
            receiverPreset={s.receiverPreset}
            axialLoadInput={s.axialLoadInput}
            onAxialChange={s.setAxialLoadInput}
            shearLoadInput={s.shearLoadInput}
            onShearChange={s.setShearLoadInput}
            slipFriction={s.slipFriction}
            onSlipChange={s.setSlipFriction}
            useImperial={s.useImperial}
            interfaceCount={s.interfaceCount}
            onInterfaceCountChange={s.setInterfaceCount}
          />

          <div className={`grid gap-3 mb-4 ${s.assemblyType === 'through-nut' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {s.assemblyType !== 'through-nut' && (
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="thread-engagement" style={{ color: 'var(--ink)' }}>Thread Engagement [mm]</label>
                <input
                  id="thread-engagement"
                  type="number" step="0.1" min="0.5"
                  className={inputClass} style={fieldStyle}
                  value={s.engagementLength || ''}
                  onChange={(e) => s.setEngagementLength(parseFloat(e.target.value) || 0)}
                />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Default: 1.5 × d</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="clamp-length" style={{ color: 'var(--ink)' }}>Clamp Length [mm]</label>
              <input
                id="clamp-length"
                type="number" step="0.1" min="1"
                className={inputClass} style={fieldStyle}
                value={s.clampLength || ''}
                onChange={(e) => {
                  const next = parseFloat(e.target.value) || 0;
                  s.setClampLength(next);
                  s.setClampLengthSplit((prev) => {
                    if (prev === 0 || prev === s.clampLength || prev > next) return next;
                    return prev;
                  });
                }}
              />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Default: 2 × d</span>
            </div>
          </div>

          {s.tappedMaterial && s.clampLength > 0 && (
            <details className="mb-4 rounded-[10px] border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }}>
              <summary className="px-3 py-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
                Advanced stiffness settings
              </summary>
              <div className="px-3 pb-3 pt-1">
                <label className="block text-sm font-medium mb-1" htmlFor="clamp-split" style={{ color: 'var(--ink)' }}>Top part share of clamp length [mm]</label>
                <input
                  id="clamp-split"
                  type="number" step="0.1" min="0" max={s.clampLength}
                  className={inputClass} style={fieldStyle}
                  value={s.clampLengthSplit}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value) || 0;
                    s.setClampLengthSplit(Math.min(Math.max(0, next), s.clampLength));
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
              aria-label="Use metric units"
              style={!s.useImperial ? { background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: '#ffffff' } : { color: 'var(--muted)' }}
              onClick={() => s.setUseImperial(false)}
            >
              Metric (N, N·m)
            </button>
            <button
              className="px-3 py-1 rounded-[10px] text-sm font-medium transition-colors"
              aria-label="Use imperial units"
              style={s.useImperial ? { background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: '#ffffff' } : { color: 'var(--muted)' }}
              onClick={() => s.setUseImperial(true)}
            >
              Imperial (lbf, lb·ft)
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <AssemblyDiagram
          screw={s.screw}
          clampedMaterial={s.clampedMaterial}
          tappedMaterial={s.tappedMaterial}
          clampLength={s.clampLength}
          engagementLength={s.engagementLength}
          assemblyType={s.assemblyType}
          headWasher={s.headWasher}
          nutWasher={s.nutWasher}
          nut={s.nut}
        />
        <Results
          inputMode={s.inputMode}
          utilization={s.utilization}
          preload={s.preload}
          torque={s.torque}
          screw={s.screw}
          clampedMaterial={s.clampedMaterial}
          tappedMaterial={s.tappedMaterial}
          friction={s.friction}
          grade={s.grade}
          engagementLength={s.engagementLength}
          clampLength={s.clampLength}
          clampLengthSplit={s.clampLengthSplit}
          useImperial={s.useImperial}
          assemblyType={s.assemblyType}
          headWasher={s.headWasher}
          nutWasher={s.nutWasher}
          nut={s.nut}
          headBearingOD={s.headBearingOD}
          headBearingID={s.headBearingID}
          nutBearingOD={s.nutBearingOD}
          nutBearingID={s.nutBearingID}
          torqueBearingOD={s.torqueBearingOD}
          torqueBearingID={s.torqueBearingID}
          tighteningMethod={s.tighteningMethod}
          relaxationLossPct={s.relaxationLossPct}
          settlementMicrons={s.settlementMicrons}
          receiverPreset={s.receiverPreset}
          axialServiceLoad={s.axialServiceLoad}
          shearServiceLoad={s.shearServiceLoad}
          slipFriction={s.slipFriction}
          interfaceCount={s.interfaceCount}
        />
        <JointDiagram
          preload={s.preload}
          screw={s.screw}
          material={s.clampedMaterial}
          clampLength={s.clampLength}
          clampLengthSplit={s.clampLengthSplit}
          gradeName={s.grade.name}
          secondMaterial={s.tappedMaterial}
        />
      </div>
    </div>
  );
}
