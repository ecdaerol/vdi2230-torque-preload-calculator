import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { FrictionPair } from '../data/friction';
import { WasherData } from '../data/washers';
import { NutData } from '../data/nuts';
import { ReceiverPreset } from '../data/receivers';
import { AssemblyType } from './AssemblyDiagram';
import { BoltGrade } from '../calc/torque';
import { TighteningMethod } from '../calc/preloadRealism';
import { OperatingStateResult } from '../calc/operatingState';
import { computeResults } from '../domain/useCase/computeResults';

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
  bearingOD?: number;
  bearingID?: number;
  tighteningMethod: TighteningMethod;
  relaxationLossPct: number;
  settlementMicrons: number;
  receiverPreset: ReceiverPreset;
  axialServiceLoad: number;
  shearServiceLoad: number;
  slipFriction: number;
}

function safe(value: number): string {
  if (!isFinite(value) || Number.isNaN(value)) return '—';
  return value.toFixed(1);
}

function safeN(value: number, decimals: number): string {
  if (!isFinite(value) || Number.isNaN(value)) return '—';
  return value.toFixed(decimals);
}

function StatusBadge({ status }: { status: 'ok' | 'warning' | 'danger' | 'na' }) {
  const styles: Record<string, React.CSSProperties> = {
    ok: { backgroundColor: '#e8f5e9', color: '#067647' },
    warning: { backgroundColor: '#fff3e0', color: '#fb8c00' },
    danger: { backgroundColor: '#fbe9e7', color: '#d52b1e' },
    na: { backgroundColor: '#f5f5f5', color: '#666666' },
  };
  const labels = { ok: 'OK', warning: 'WARNING', danger: 'DANGER', na: 'N/A' };
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold" style={styles[status]}>
      {labels[status]}
    </span>
  );
}

function getOperatingStatus(
  axialServiceLoad: number,
  shearServiceLoad: number,
  operatingState: OperatingStateResult | null,
): 'ok' | 'warning' | 'danger' | 'na' {
  if (axialServiceLoad <= 0 && shearServiceLoad <= 0) return 'na';
  if (!operatingState) return 'warning';
  if (operatingState.isSeparated || operatingState.willSlip || operatingState.shearSafetyFactor < 1) return 'danger';
  if (operatingState.separationMargin < 1.5 || operatingState.slipSafetyFactor < 1.5 || operatingState.shearSafetyFactor < 1.5) return 'warning';
  return 'ok';
}

export default function Results({
  inputMode,
  utilization,
  preload,
  torque,
  screw,
  clampedMaterial,
  tappedMaterial,
  friction,
  grade,
  engagementLength,
  clampLength,
  clampLengthSplit,
  useImperial,
  assemblyType,
  headWasher,
  nutWasher,
  nut,
  bearingOD,
  bearingID,
  tighteningMethod,
  relaxationLossPct,
  settlementMicrons,
  receiverPreset,
  axialServiceLoad,
  shearServiceLoad,
  slipFriction,
}: Props) {
  if (!screw) {
    return (
      <div className="card p-5">
        <p className="text-center" style={{ color: 'var(--muted)' }}>Select a screw and enter a value to see results.</p>
      </div>
    );
  }

  if (preload <= 0) {
    const emptyStateMessage = inputMode === 'utilization'
      ? 'Set torque percentage above 0%'
      : inputMode === 'torque'
        ? 'Enter a tightening torque above 0'
        : 'Enter a preload above 0';

    return (
      <div className="card p-5">
        <p className="text-center text-sm font-medium" style={{ color: 'var(--danger)' }}>
          {emptyStateMessage}
        </p>
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

  const computed = computeResults({
    preload,
    torque,
    screw,
    clampedMaterial,
    tappedMaterial,
    friction,
    grade,
    engagementLength,
    clampLength,
    clampLengthSplit,
    assemblyType,
    headWasher,
    nutWasher,
    nut,
    bearingOD,
    bearingID,
    tighteningMethod,
    relaxationLossPct,
    settlementMicrons,
    receiverPreset,
    axialServiceLoad,
    shearServiceLoad,
    slipFriction,
  });

  const {
    boltStress,
    headSurfacePressure: sp,
    nutSurfacePressure: spNut,
    threadStripping: ts,
    jointStiffness: js,
    totalScatter,
    torqueMin,
    torqueMax,
    servicePreload,
    operatingState,
  } = computed;

  const hasSurfacePressure = screw.hasHead && !screw.isCountersunk && clampedMaterial;

  const Nto = useImperial ? 0.2248 : 1;
  const Nmto = useImperial ? 0.7376 : 1;
  const forceUnit = useImperial ? 'lbf' : 'N';
  const torqueUnit = useImperial ? 'lb·ft' : 'N·m';
  const pressureUnit = 'MPa';

  const safetyColor = (sf: number) => (sf < 1 ? 'var(--danger)' : sf < 1.5 ? 'var(--warn)' : 'var(--ok)');

  const serviceLossPercent = servicePreload.initial.preloadNominal > 0
    ? 100 * (1 - servicePreload.service.preloadNominal / servicePreload.initial.preloadNominal)
    : 0;

  const creepSensitive = [clampedMaterial, tappedMaterial]
    .filter((material): material is MaterialData => !!material)
    .some((material) => material.creepRisk !== 'low');

  const operatingStatus = getOperatingStatus(axialServiceLoad, shearServiceLoad, operatingState);
  const receiverMismatch = receiverPreset.recommendedCategories !== 'any'
    && tappedMaterial
    && !receiverPreset.recommendedCategories.includes(tappedMaterial.category);

  const warnings: string[] = [...computed.validationWarnings];
  const validationErrors = computed.validationErrors;
  if (boltStress.utilization > 90) {
    warnings.push('Bolt utilization exceeds 90% — consider reducing preload or upgrading grade.');
  }
  if (friction.muThread < 0.04 || friction.muHead < 0.04) {
    warnings.push('Friction coefficient below 0.04 — results may be unreliable. Verify lubrication conditions.');
  }
  if (engagementLength > 0 && engagementLength < screw.pitch) {
    warnings.push(`Thread engagement (${engagementLength.toFixed(1)} mm) is less than one pitch (${screw.pitch.toFixed(2)} mm) — stripping risk is very high.`);
  }
  if (clampLength > 0 && clampLength < 1) {
    warnings.push('Clamp length is less than 1 mm — joint stiffness and settlement results may be inaccurate.');
  }
  if (clampLength > 0 && screw.d > 0 && clampLength > 10 * screw.d) {
    warnings.push(`Clamp length (${clampLength.toFixed(1)} mm) is very long relative to bolt diameter (${screw.d.toFixed(1)} mm) — verify setup.`);
  }
  if (totalScatter > 0.2) {
    warnings.push(`Expected preload scatter is wide (±${Math.round(totalScatter * 100)}%) — calibrate the joint condition or tighten with a higher-control method if preload repeatability matters.`);
  }
  if (serviceLossPercent > 20) {
    warnings.push(`Estimated service preload drops by about ${safeN(serviceLossPercent, 0)}% after relaxation/settlement — consider washers, larger clamp area, or lower-creep materials.`);
  }
  if (settlementMicrons > 0 && !js) {
    warnings.push('Settlement loss could not be translated into force because clamp stiffness is unavailable — select clamp material and clamp length for a better estimate.');
  }
  if (receiverMismatch) {
    warnings.push(`${receiverPreset.label} is not the usual choice for ${tappedMaterial?.name}. Double-check that the receiver type matches the part design.`);
  }
  if ((axialServiceLoad > 0 || shearServiceLoad > 0) && !operatingState) {
    warnings.push('Operating load checks need clamp stiffness. Select clamp material and clamp length to evaluate separation and slip behavior.');
  }
  if (operatingState?.isSeparated) {
    warnings.push(`The joint is predicted to separate under the entered axial load. Separation load is about ${safeN(operatingState.separationLoad * Nto, 0)} ${forceUnit}.`);
  } else if (operatingState && axialServiceLoad > 0 && operatingState.separationMargin < 1.5) {
    warnings.push(`Separation margin is low (SF ${safeN(operatingState.separationMargin, 2)}). Consider more preload, more clamp stiffness, or lower axial load.`);
  }
  if (operatingState?.willSlip) {
    warnings.push(`Slip is predicted under the entered transverse load. Available friction resistance is about ${safeN(operatingState.availableSlipResistance * Nto, 0)} ${forceUnit}.`);
  } else if (operatingState && shearServiceLoad > 0 && operatingState.slipSafetyFactor < 1.5) {
    warnings.push(`Slip margin is low (SF ${safeN(operatingState.slipSafetyFactor, 2)}). Consider more clamp load, more interfaces, or a higher slip-friction condition.`);
  }
  if (operatingState && shearServiceLoad > 0 && operatingState.shearSafetyFactor < 1.5) {
    warnings.push(`Fastener shear margin is low (SF ${safeN(operatingState.shearSafetyFactor, 2)}). Verify the shear path and fastener sizing.`);
  }

  const disclaimers: string[] = [];
  if (!screw.hasHead) {
    disclaimers.push('Set screw: no head bearing surface. Surface pressure and head torque terms are not applicable.');
  }
  if (screw.isCountersunk) {
    disclaimers.push('Countersunk head: flat head-bearing pressure is not shown because the contact geometry differs from a standard bearing face.');
  }
  if (screw.partiallyThreaded) {
    disclaimers.push('Partially threaded bolt: tensile-stress-area and clamp model are simplified and do not separately model unthreaded shank stretch.');
  }

  return (
    <div className="space-y-4">
      {validationErrors.length > 0 && (
        <div className="card p-4" style={{ backgroundColor: '#fdecea', borderLeft: '4px solid #d52b1e' }}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#b42318' }}>Input Validation Errors</h3>
          <ul className="text-sm list-disc list-inside space-y-0.5" style={{ color: '#7a271a' }}>
            {validationErrors.map((error, index) => <li key={index}>{error}</li>)}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="card p-4" style={{ backgroundColor: '#fff8e1', borderLeft: '4px solid #ffa000' }}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#e65100' }}>Warnings</h3>
          <ul className="text-sm list-disc list-inside space-y-0.5" style={{ color: '#4e342e' }}>
            {warnings.map((warning, index) => <li key={index}>{warning}</li>)}
          </ul>
        </div>
      )}

      {disclaimers.length > 0 && (
        <div className="card p-4" style={{ backgroundColor: '#f3f4f6', borderLeft: '4px solid #9ca3af' }}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#374151' }}>Notes</h3>
          <ul className="text-sm list-disc list-inside space-y-0.5" style={{ color: '#374151' }}>
            {disclaimers.map((disclaimer, index) => <li key={index}>{disclaimer}</li>)}
          </ul>
        </div>
      )}

      <div className="card p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Torque & Preload</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Tightening Torque</div>
            <div className="text-2xl font-bold font-mono" style={{ color: 'var(--brand)' }}>
              {safeN(torque * Nmto, 3)} <span className="text-sm">{torqueUnit}</span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
              Torque for nominal preload: {safeN(torqueMin * Nmto, 3)} – {safeN(torqueMax * Nmto, 3)} {torqueUnit}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Initial Preload</div>
            <div className="text-2xl font-bold font-mono" style={{ color: 'var(--brand)' }}>
              {safeN(servicePreload.initial.preloadNominal * Nto, 0)} <span className="text-sm">{forceUnit}</span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
              Expected band: {safeN(servicePreload.initial.preloadMin * Nto, 0)} – {safeN(servicePreload.initial.preloadMax * Nto, 0)} {forceUnit}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Service Preload</div>
            <div className="text-2xl font-bold font-mono" style={{ color: serviceLossPercent > 20 ? 'var(--warn)' : 'var(--brand)' }}>
              {safeN(servicePreload.service.preloadNominal * Nto, 0)} <span className="text-sm">{forceUnit}</span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
              After losses: {safeN(servicePreload.service.preloadMin * Nto, 0)} – {safeN(servicePreload.service.preloadMax * Nto, 0)} {forceUnit}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Preload Realism</h3>
          <StatusBadge status={serviceLossPercent > 20 ? 'warning' : 'ok'} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Tightening method</div>
            <div className="text-sm font-semibold">{tighteningMethod.label}</div>
          </div>
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Combined scatter</div>
            <div className="text-sm font-mono font-semibold">±{safeN(totalScatter * 100, 1)}%</div>
          </div>
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Relaxation loss</div>
            <div className="text-sm font-mono font-semibold">{safeN(servicePreload.relaxationLoss * Nto, 0)} {forceUnit}</div>
          </div>
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Settlement loss</div>
            <div className="text-sm font-mono font-semibold">{safeN(servicePreload.embeddingLoss * Nto, 0)} {forceUnit}</div>
          </div>
        </div>
        <div className="text-[10px] space-y-1" style={{ color: 'var(--muted)' }}>
          <div>{tighteningMethod.notes}</div>
          <div>
            Inputs: preset scatter ±{Math.round(friction.scatter * 100)}% + method scatter ±{Math.round(tighteningMethod.processScatter * 100)}% · relaxation allowance {safeN(relaxationLossPct, 0)}% · settlement {safeN(settlementMicrons, 0)} μm
          </div>
          <div>
            {servicePreload.equivalentStiffness > 0
              ? `Equivalent joint stiffness for settlement loss: ${safeN(servicePreload.equivalentStiffness / 1000, 3)} kN/mm`
              : 'Settlement loss uses the clamp model when clamp material and clamp length are available.'}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Operating State</h3>
          <StatusBadge status={operatingStatus} />
        </div>
        {!operatingState ? (
          axialServiceLoad > 0 || shearServiceLoad > 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Operating-load checks need a clamp stiffness model. Select clamp material and clamp length to evaluate separation and slip.
            </p>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Enter axial or transverse service loads to evaluate separation, slip, and simple shear behavior.
            </p>
          )
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Axial load</div>
                <div className="text-sm font-mono font-semibold">{safeN(axialServiceLoad * Nto, 0)} {forceUnit}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Added bolt load</div>
                <div className="text-sm font-mono font-semibold">{safeN(operatingState.additionalBoltLoad * Nto, 0)} {forceUnit}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Remaining clamp</div>
                <div className="text-sm font-mono font-semibold" style={{ color: operatingState.remainingClampForce <= 0 ? 'var(--danger)' : 'var(--ink)' }}>
                  {safeN(operatingState.remainingClampForce * Nto, 0)} {forceUnit}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Bolt force under load</div>
                <div className="text-sm font-mono font-semibold">{safeN(operatingState.boltForceUnderAxialLoad * Nto, 0)} {forceUnit}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Separation load</div>
                <div className="text-sm font-mono font-semibold">{safeN(operatingState.separationLoad * Nto, 0)} {forceUnit}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Separation margin</div>
                <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(operatingState.separationMargin) }}>
                  {safeN(operatingState.separationMargin, 2)}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Slip resistance</div>
                <div className="text-sm font-mono font-semibold">{safeN(operatingState.availableSlipResistance * Nto, 0)} {forceUnit}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Slip safety factor</div>
                <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(operatingState.slipSafetyFactor) }}>
                  {safeN(operatingState.slipSafetyFactor, 2)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Shear load</div>
                <div className="text-sm font-mono font-semibold">{safeN(shearServiceLoad * Nto, 0)} {forceUnit}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Shear stress</div>
                <div className="text-sm font-mono font-semibold">{safeN(operatingState.shearStress, 1)} MPa</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Shear allowable</div>
                <div className="text-sm font-mono font-semibold">{safeN(operatingState.shearAllowable, 1)} MPa</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Shear safety factor</div>
                <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(operatingState.shearSafetyFactor) }}>
                  {safeN(operatingState.shearSafetyFactor, 2)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[10px] space-y-1" style={{ color: 'var(--muted)' }}>
              <div>Load split from stiffness model: bolt share n = {safeN(operatingState.boltLoadShare, 3)} · clamp share = {safeN(operatingState.clampLoadShare, 3)}</div>
              <div>Slip check uses remaining service clamp load and μ = {safeN(slipFriction, 2)} at the clamped interface.</div>
            </div>
          </>
        )}
      </div>

      {creepSensitive && (
        <div className="card p-5" style={{ backgroundColor: '#fff8e1', borderLeft: '4px solid #ffa000' }}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#e65100' }}>Creep / Relaxation Watch</h3>
          <p className="text-sm mb-2" style={{ color: '#4e342e' }}>
            One or more selected materials are creep-sensitive. Service preload may continue to fall after initial settling, especially in polymers and printed parts.
          </p>
          <ul className="text-sm list-disc list-inside space-y-0.5" style={{ color: '#4e342e' }}>
            <li>Consider larger washers or support washers to reduce local compression.</li>
            <li>Use lower initial utilization if long-term preload retention matters.</li>
            <li>For production designs, validate preload retention with a time/temperature test.</li>
          </ul>
        </div>
      )}

      <div className="card p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Bolt Stress — {grade.name}</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>σ axial</div>
            <div className="text-sm font-mono font-semibold">{safe(boltStress.axialStress)} MPa</div>
          </div>
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>τ torsion</div>
            <div className="text-sm font-mono font-semibold">{safe(boltStress.torsionalStress)} MPa</div>
          </div>
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>σ von Mises</div>
            <div className="text-sm font-mono font-bold" style={{ color: boltStress.utilization > 100 ? 'var(--danger)' : boltStress.utilization > 90 ? 'var(--warn)' : 'var(--ok)' }}>
              {safe(boltStress.vonMisesStress)} MPa
            </div>
          </div>
        </div>
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
                    : 'linear-gradient(90deg, #66bb6a, #43a047)',
              }}
            />
          </div>
        </div>
        <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
          {inputMode === 'utilization'
            ? <>Rp₀.₂ = {grade.Rp02} MPa · Selected torque level: {utilization}% → Actual: {safe(boltStress.utilization)}% (von Mises)</>
            : inputMode === 'torque'
              ? <>Rp₀.₂ = {grade.Rp02} MPa · Derived from entered torque → Actual: {safe(boltStress.utilization)}% (von Mises)</>
              : <>Rp₀.₂ = {grade.Rp02} MPa · Derived from entered preload → Actual: {safe(boltStress.utilization)}% (von Mises)</>}
        </div>
        {boltStress.utilization > 100 && (
          <div className="mt-2 text-xs font-semibold" style={{ color: 'var(--danger)' }}>
            Bolt proof load exceeded! Reduce utilization or use a higher grade.
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            Surface Pressure (Head){clampedMaterial ? ` — ${clampedMaterial.name}` : ''}{headWasher ? ` + ${headWasher.standard} washer` : ''}
          </h3>
          <StatusBadge status={!hasSurfacePressure ? 'na' : sp!.status} />
        </div>
        {!hasSurfacePressure ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {!screw.hasHead ? 'N/A for set screws (no bearing surface)' : screw.isCountersunk ? 'N/A for countersunk heads' : 'Select a clamped material to check surface pressure.'}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Pressure</div>
                <div className="text-sm font-mono font-semibold">{safe(sp!.pressure)} {pressureUnit}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Limit (σy)</div>
                <div className="text-sm font-mono font-semibold">{safe(sp!.limit)} {pressureUnit}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Safety Factor</div>
                <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(sp!.safetyFactor) }}>{safeN(sp!.safetyFactor, 2)}</div>
              </div>
            </div>
            <div className="mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>Bearing area: {safe(sp!.bearingArea)} mm²</div>
          </>
        )}
      </div>

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
                  <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Limit (σy)</div>
                  <div className="text-sm font-mono font-semibold">{safe(spNut.limit)} {pressureUnit}</div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Safety Factor</div>
                  <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(spNut.safetyFactor) }}>{safeN(spNut.safetyFactor, 2)}</div>
                </div>
              </div>
              <div className="mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>Bearing area: {safe(spNut.bearingArea)} mm²</div>
            </>
          )}
        </div>
      )}

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
                <div className="text-sm font-mono font-semibold" style={{ color: safetyColor(ts.safetyFactor) }}>{safeN(ts.safetyFactor, 2)}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Min. Engagement</div>
                <div className="text-sm font-mono font-semibold">{safe(ts.minEngagementLength)} mm</div>
              </div>
            </div>
            <div className="mt-2 text-[10px] space-y-1" style={{ color: 'var(--muted)' }}>
              <div>Receiver: <span className="font-semibold">{ts.receiverLabel}</span> · Capacity factor ×{safeN(ts.receiverFactor, 2)}</div>
              <div>
                Critical mode: <span className="font-semibold">{ts.criticalMode === 'internal' ? 'Internal (nut/tapped material)' : 'External (bolt thread)'}</span>
                {ts.externalStrippingForce !== Infinity && (
                  <> · Internal: {safeN(ts.internalStrippingForce * Nto, 0)} {forceUnit} · External: {safeN(ts.externalStrippingForce * Nto, 0)} {forceUnit}</>
                )}
              </div>
            </div>
            {ts.status !== 'ok' && (
              <div className="mt-2 text-xs" style={{ color: 'var(--warn)' }}>
                Increase engagement length to ≥ {safe(ts.minEngagementLength)} mm for SF ≥ 1.5
              </div>
            )}
          </>
        )}
      </div>

      {js && (
        <div className="card p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Joint Stiffness</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Bolt stiffness</div>
              <div className="text-sm font-mono font-semibold">{safe(js.boltStiffness / 1000)} kN/mm</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Clamp stiffness</div>
              <div className="text-sm font-mono font-semibold">{safe(js.clampStiffness / 1000)} kN/mm</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Load Factor n</div>
              <div className="text-sm font-mono font-semibold">{safeN(js.loadFactor, 3)}</div>
            </div>
          </div>
          {tappedMaterial && (
            <div className="mt-2 text-[10px]" style={{ color: 'var(--muted)' }}>
              Stiffness model: {clampedMaterial?.name ?? 'Top material'} {safe(clampLengthSplit)} mm + {tappedMaterial.name} {safe(Math.max(0, clampLength - clampLengthSplit))} mm
            </div>
          )}
        </div>
      )}
    </div>
  );
}
