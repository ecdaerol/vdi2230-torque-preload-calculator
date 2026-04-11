import { useMemo } from 'react';
import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { FrictionPair } from '../data/friction';
import { WasherData } from '../data/washers';
import { NutData } from '../data/nuts';
import { ReceiverPreset } from '../data/receivers';
import { AssemblyType } from './AssemblyDiagram';
import { BoltGrade } from '../calc/torque';
import { TighteningMethod } from '../calc/preloadRealism';
import { computeResults } from '../domain/useCase/computeResults';
import { getUnitFactors, safeN } from './results/ResultsUtils';
import TorquePreloadCard from './results/TorquePreloadCard';
import PreloadRealismCard from './results/PreloadRealismCard';
import OperatingStateCard from './results/OperatingStateCard';
import BoltStressCard from './results/BoltStressCard';
import { SurfacePressureCard, ThreadStrippingCard, JointStiffnessCard } from './results/SafetyChecksCard';

interface Props {
  inputMode: 'utilization' | 'torque' | 'preload';
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
  clampLengthSplit: number;
  useImperial: boolean;
  assemblyType: AssemblyType;
  headWasher: WasherData | null;
  nutWasher: WasherData | null;
  nut: NutData | null;
  headBearingOD?: number;
  headBearingID?: number;
  nutBearingOD?: number;
  nutBearingID?: number;
  torqueBearingOD?: number;
  torqueBearingID?: number;
  tighteningMethod: TighteningMethod;
  relaxationLossPct: number;
  settlementMicrons: number;
  receiverPreset: ReceiverPreset;
  axialServiceLoad: number;
  shearServiceLoad: number;
  slipFriction: number;
  interfaceCount: number;
}

export default function Results(props: Props) {
  const {
    inputMode, utilization, preload, torque, screw, clampedMaterial, tappedMaterial,
    friction, grade, engagementLength, clampLength, clampLengthSplit, useImperial,
    assemblyType, headWasher, nutWasher, nut,
    headBearingOD, headBearingID, nutBearingOD, nutBearingID,
    torqueBearingOD, torqueBearingID,
    tighteningMethod, relaxationLossPct, settlementMicrons, receiverPreset,
    axialServiceLoad, shearServiceLoad, slipFriction, interfaceCount,
  } = props;

  // --- Empty states ---
  if (!screw) {
    return (
      <div className="card p-5">
        <p className="text-center" style={{ color: 'var(--muted)' }}>Select a screw and enter a value to see results.</p>
      </div>
    );
  }

  if (preload <= 0) {
    const msg = inputMode === 'utilization'
      ? 'Set torque percentage above 0%'
      : inputMode === 'torque'
        ? 'Enter a tightening torque above 0'
        : 'Enter a preload above 0';
    return (
      <div className="card p-5">
        <p className="text-center text-sm font-medium" style={{ color: 'var(--danger)' }}>{msg}</p>
      </div>
    );
  }

  if (!isFinite(preload) || Number.isNaN(preload) || !isFinite(torque) || Number.isNaN(torque)) {
    return (
      <div className="card p-5">
        <p className="text-center text-sm font-medium" style={{ color: 'var(--danger)' }}>
          Invalid input: preload or torque is not a finite number.
        </p>
      </div>
    );
  }

  // --- Compute all results ---
  const computed = useMemo(() => computeResults({
    preload, torque, screw, clampedMaterial, tappedMaterial, friction, grade,
    engagementLength, clampLength, clampLengthSplit, assemblyType,
    headWasher, nutWasher, nut,
    headBearingOD, headBearingID, nutBearingOD, nutBearingID,
    torqueBearingOD, torqueBearingID,
    tighteningMethod, relaxationLossPct, settlementMicrons, receiverPreset,
    axialServiceLoad, shearServiceLoad, slipFriction, interfaceCount,
  }), [
    preload, torque, screw, clampedMaterial, tappedMaterial, friction, grade,
    engagementLength, clampLength, clampLengthSplit, assemblyType,
    headWasher, nutWasher, nut,
    headBearingOD, headBearingID, nutBearingOD, nutBearingID,
    torqueBearingOD, torqueBearingID,
    tighteningMethod, relaxationLossPct, settlementMicrons, receiverPreset,
    axialServiceLoad, shearServiceLoad, slipFriction, interfaceCount,
  ]);

  const { boltStress, headSurfacePressure: sp, nutSurfacePressure: spNut,
    threadStripping: ts, jointStiffness: js, totalScatter,
    torqueMin, torqueMax, servicePreload, operatingState,
    validationErrors, validationWarnings } = computed;

  const units = getUnitFactors(useImperial);
  const hasSurfacePressure = screw.hasHead && !screw.isCountersunk && !!clampedMaterial;

  const serviceLossPercent = servicePreload.initial.preloadNominal > 0
    ? 100 * (1 - servicePreload.service.preloadNominal / servicePreload.initial.preloadNominal)
    : 0;

  const creepSensitive = [clampedMaterial, tappedMaterial]
    .filter((m): m is MaterialData => !!m)
    .some((m) => m.creepRisk !== 'low');

  const receiverMismatch = receiverPreset.recommendedCategories !== 'any'
    && tappedMaterial
    && !receiverPreset.recommendedCategories.includes(tappedMaterial.category);

  // --- Build warnings ---
  const warnings: string[] = [...validationWarnings];
  if (boltStress.utilization > 90) warnings.push('Bolt utilization exceeds 90% — consider reducing preload or upgrading grade.');
  if (friction.muThread < 0.04 || friction.muHead < 0.04) warnings.push('Friction coefficient below 0.04 — results may be unreliable.');
  if (engagementLength > 0 && engagementLength < screw.pitch) warnings.push(`Thread engagement (${engagementLength.toFixed(1)} mm) < one pitch — stripping risk is very high.`);
  if (clampLength > 0 && clampLength < 1) warnings.push('Clamp length < 1 mm — joint stiffness results may be inaccurate.');
  if (clampLength > 0 && screw.d > 0 && clampLength > 10 * screw.d) warnings.push(`Clamp length (${clampLength.toFixed(1)} mm) very long relative to bolt diameter — verify setup.`);
  if (totalScatter > 0.2) warnings.push(`Preload scatter is wide (±${Math.round(totalScatter * 100)}%) — consider a higher-control tightening method.`);
  if (serviceLossPercent > 20) warnings.push(`Service preload drops ~${safeN(serviceLossPercent, 0)}% after losses — consider washers or lower-creep materials.`);
  if (settlementMicrons > 0 && !js) warnings.push('Settlement loss needs clamp stiffness — select clamp material and clamp length.');
  if (receiverMismatch) warnings.push(`${receiverPreset.label} is not typical for ${tappedMaterial?.name}. Verify receiver type.`);
  if ((axialServiceLoad > 0 || shearServiceLoad > 0) && !operatingState) warnings.push('Operating load checks need clamp stiffness.');
  if (operatingState?.isSeparated) warnings.push(`Joint predicted to separate. Separation load: ~${safeN(operatingState.separationLoad * units.Nto, 0)} ${units.forceUnit}.`);
  else if (operatingState && axialServiceLoad > 0 && operatingState.separationMargin < 1.5) warnings.push(`Separation margin low (SF ${safeN(operatingState.separationMargin, 2)}).`);
  if (operatingState?.willSlip) warnings.push(`Slip predicted. Available resistance: ~${safeN(operatingState.availableSlipResistance * units.Nto, 0)} ${units.forceUnit}.`);
  else if (operatingState && shearServiceLoad > 0 && operatingState.slipSafetyFactor < 1.5) warnings.push(`Slip margin low (SF ${safeN(operatingState.slipSafetyFactor, 2)}).`);
  if (operatingState && shearServiceLoad > 0 && operatingState.shearSafetyFactor < 1.5) warnings.push(`Fastener shear margin low (SF ${safeN(operatingState.shearSafetyFactor, 2)}).`);

  const disclaimers: string[] = [];
  if (!screw.hasHead) disclaimers.push('Set screw: no head bearing surface. Surface pressure and head torque terms are not applicable.');
  if (screw.isCountersunk) disclaimers.push('Countersunk head: flat head-bearing pressure is not shown.');
  if (screw.partiallyThreaded) disclaimers.push('Partially threaded bolt: simplified model — does not separately model unthreaded shank stretch.');

  // --- Render ---
  return (
    <div className="space-y-4">
      {validationErrors.length > 0 && (
        <div className="card p-4" style={{ backgroundColor: 'var(--danger-bg)', borderLeft: '4px solid var(--danger)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--danger)' }}>Input Errors</h3>
          <ul className="text-sm list-disc list-inside space-y-0.5" style={{ color: 'var(--danger)' }}>
            {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="card p-4" style={{ backgroundColor: 'var(--alert-bg)', borderLeft: '4px solid var(--alert-border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--alert-heading)' }}>Warnings</h3>
          <ul className="text-sm list-disc list-inside space-y-0.5" style={{ color: 'var(--alert-body)' }}>
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {disclaimers.length > 0 && (
        <div className="card p-4" style={{ backgroundColor: 'var(--info-bg)', borderLeft: '4px solid var(--info-border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--info-heading)' }}>Notes</h3>
          <ul className="text-sm list-disc list-inside space-y-0.5" style={{ color: 'var(--info-body)' }}>
            {disclaimers.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}

      <TorquePreloadCard torque={torque} torqueMin={torqueMin} torqueMax={torqueMax}
        servicePreload={servicePreload} serviceLossPercent={serviceLossPercent} units={units} />

      <PreloadRealismCard servicePreload={servicePreload} tighteningMethod={tighteningMethod}
        friction={friction} totalScatter={totalScatter} relaxationLossPct={relaxationLossPct}
        settlementMicrons={settlementMicrons} serviceLossPercent={serviceLossPercent} units={units} />

      <OperatingStateCard operatingState={operatingState} axialServiceLoad={axialServiceLoad}
        shearServiceLoad={shearServiceLoad} slipFriction={slipFriction} units={units} />

      {creepSensitive && (
        <div className="card p-5" style={{ backgroundColor: 'var(--alert-bg)', borderLeft: '4px solid var(--alert-border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--alert-heading)' }}>Creep / Relaxation Watch</h3>
          <p className="text-sm mb-2" style={{ color: 'var(--alert-body)' }}>
            One or more selected materials are creep-sensitive. Service preload may continue to fall after initial settling.
          </p>
          <ul className="text-sm list-disc list-inside space-y-0.5" style={{ color: 'var(--alert-body)' }}>
            <li>Consider larger washers or support washers to reduce local compression.</li>
            <li>Use lower initial utilization if long-term preload retention matters.</li>
            <li>For production designs, validate preload retention with a time/temperature test.</li>
          </ul>
        </div>
      )}

      <BoltStressCard boltStress={boltStress} grade={grade} inputMode={inputMode}
        utilization={utilization} units={units} />

      <SurfacePressureCard side="head" sp={sp} material={clampedMaterial}
        washer={headWasher} screw={screw} available={hasSurfacePressure} units={units} />

      {assemblyType === 'through-nut' && (
        <SurfacePressureCard side="nut" sp={spNut} material={tappedMaterial}
          washer={nutWasher} screw={screw} available={!!spNut} units={units} />
      )}

      <ThreadStrippingCard ts={ts} tappedMaterial={tappedMaterial}
        assemblyType={assemblyType} units={units} />

      {js && (
        <JointStiffnessCard js={js} clampedMaterial={clampedMaterial}
          tappedMaterial={tappedMaterial} clampLength={clampLength} clampLengthSplit={clampLengthSplit} />
      )}
    </div>
  );
}
