import type { FrictionPair } from '../../data/friction';
import type { MaterialData } from '../../data/materials';
import type { NutData } from '../../data/nuts';
import type { ReceiverPreset } from '../../data/receivers';
import type { ScrewData } from '../../data/screws';
import type { WasherData } from '../../data/washers';
import type { AssemblyType } from '../types';
import { type BoltGrade, calculateBoltStress, calculateTorque } from '../../calc/torque';
import { calculateSurfacePressure, type SurfacePressureResult } from '../../calc/surfacePressure';
import { calculateThreadStripping, type ThreadStrippingResult } from '../../calc/threadStripping';
import { calculateJointStiffness, type JointStiffnessResult } from '../../calc/jointStiffness';
import { calculateServicePreload, combineScatter, type TighteningMethod } from '../../calc/preloadRealism';
import { calculateOperatingState, type OperatingStateResult } from '../../calc/operatingState';
import { validateCoreInputs } from '../validation';

export interface ComputeResultsInput {
  preload: number;
  torque: number;
  screw: ScrewData;
  clampedMaterial: MaterialData | null;
  tappedMaterial: MaterialData | null;
  friction: FrictionPair;
  grade: BoltGrade;
  engagementLength: number;
  clampLength: number;
  clampLengthSplit: number;
  assemblyType: AssemblyType;
  headWasher: WasherData | null;
  nutWasher: WasherData | null;
  nut: NutData | null;
  /** Head-side bearing OD (from washer or screw head) */
  headBearingOD?: number;
  /** Head-side bearing ID (from washer or hole) */
  headBearingID?: number;
  /** Nut-side bearing OD (from washer or nut) */
  nutBearingOD?: number;
  /** Nut-side bearing ID (from washer or hole) */
  nutBearingID?: number;
  /** Torque-side bearing OD (depends on turnedSide) */
  torqueBearingOD?: number;
  /** Torque-side bearing ID (depends on turnedSide) */
  torqueBearingID?: number;
  tighteningMethod: TighteningMethod;
  relaxationLossPct: number;
  settlementMicrons: number;
  receiverPreset: ReceiverPreset;
  axialServiceLoad: number;
  shearServiceLoad: number;
  slipFriction: number;
  /** Number of slip interfaces (1 for tapped hole, ≥1 for through-bolt) */
  interfaceCount: number;
}

export interface ComputeResultsOutput {
  validationErrors: string[];
  validationWarnings: string[];
  boltStress: ReturnType<typeof calculateBoltStress>;
  headSurfacePressure: SurfacePressureResult | null;
  nutSurfacePressure: SurfacePressureResult | null;
  threadStripping: ThreadStrippingResult | null;
  jointStiffness: JointStiffnessResult | null;
  totalScatter: number;
  torqueMin: number;
  torqueMax: number;
  servicePreload: ReturnType<typeof calculateServicePreload>;
  operatingState: OperatingStateResult | null;
}

export function computeResults(input: ComputeResultsInput): ComputeResultsOutput {
  const validation = validateCoreInputs({
    screw: input.screw,
    preload: input.preload,
    torque: input.torque,
    friction: input.friction,
    clampLength: input.clampLength,
    engagementLength: input.engagementLength,
    relaxationLossPct: input.relaxationLossPct,
    settlementMicrons: input.settlementMicrons,
    slipFriction: input.slipFriction,
    axialServiceLoad: input.axialServiceLoad,
    shearServiceLoad: input.shearServiceLoad,
  });

  const boltStress = calculateBoltStress(input.preload, input.screw, input.grade, input.friction);

  // Head-side surface pressure
  const hasHeadSurface = input.screw.hasHead && !input.screw.isCountersunk && input.clampedMaterial;
  const headSurfacePressure = hasHeadSurface
    ? calculateSurfacePressure(
        input.preload,
        input.screw,
        input.clampedMaterial!,
        input.headBearingOD,
        input.headBearingID,
      )
    : null;

  // Nut-side surface pressure (through-bolt only)
  const nutSurfacePressure = input.assemblyType === 'through-nut' && input.tappedMaterial && input.nut
    ? calculateSurfacePressure(
        input.preload,
        input.screw,
        input.tappedMaterial,
        input.nutBearingOD,
        input.nutBearingID,
      )
    : null;

  // Thread stripping (tapped-hole only)
  const threadStripping = input.assemblyType !== 'through-nut' && input.tappedMaterial && input.engagementLength > 0
    ? calculateThreadStripping(input.preload, input.screw, input.tappedMaterial, input.engagementLength, input.grade, input.receiverPreset)
    : null;

  // FIX #3: use actual bearing diameter (considering washers) for joint stiffness
  const headStiffnessOD = input.headBearingOD ?? input.screw.headDiameter;
  const bottomStiffnessOD = input.nutBearingOD ?? input.screw.headDiameter;

  const jointStiffness = input.clampedMaterial && input.clampLength > 0
    ? calculateJointStiffness(
        input.preload,
        input.screw,
        input.clampedMaterial,
        input.clampLength,
        input.grade.name,
        input.tappedMaterial,
        input.clampLengthSplit,
        headStiffnessOD,
        bottomStiffnessOD,
      )
    : null;

  // Torque scatter band
  const scatter = input.friction.scatter ?? 0.2;
  const torqueMin = calculateTorque(
    input.preload,
    input.screw,
    {
      ...input.friction,
      muThread: input.friction.muThread * (1 - scatter),
      muHead: input.friction.muHead * (1 - scatter),
    },
    input.torqueBearingOD,
    input.torqueBearingID,
  );

  const torqueMax = calculateTorque(
    input.preload,
    input.screw,
    {
      ...input.friction,
      muThread: input.friction.muThread * (1 + scatter),
      muHead: input.friction.muHead * (1 + scatter),
    },
    input.torqueBearingOD,
    input.torqueBearingID,
  );

  const totalScatter = combineScatter(input.friction.scatter, input.tighteningMethod.processScatter);

  const servicePreload = calculateServicePreload(
    input.torque,
    input.screw,
    input.friction,
    totalScatter,
    input.relaxationLossPct,
    input.settlementMicrons,
    jointStiffness,
    input.torqueBearingOD,
    input.torqueBearingID,
  );

  // FIX #5: pass interfaceCount to operating state
  const operatingState = jointStiffness
    ? calculateOperatingState({
        servicePreload: servicePreload.service.preloadNominal,
        axialLoad: input.axialServiceLoad,
        shearLoad: input.shearServiceLoad,
        loadFactor: jointStiffness.loadFactor,
        interfaceFriction: input.slipFriction,
        interfaceCount: input.interfaceCount,
        screw: input.screw,
        grade: input.grade,
      })
    : null;

  return {
    validationErrors: validation.errors,
    validationWarnings: validation.warnings,
    boltStress,
    headSurfacePressure,
    nutSurfacePressure,
    threadStripping,
    jointStiffness,
    totalScatter,
    torqueMin,
    torqueMax,
    servicePreload,
    operatingState,
  };
}
