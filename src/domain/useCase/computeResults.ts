import type { FrictionPair } from '../../data/friction';
import type { MaterialData } from '../../data/materials';
import type { NutData } from '../../data/nuts';
import type { ReceiverPreset } from '../../data/receivers';
import type { ScrewData } from '../../data/screws';
import type { WasherData } from '../../data/washers';
import type { AssemblyType } from '../../components/AssemblyDiagram';
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

  const hasHeadSurface = input.screw.hasHead && !input.screw.isCountersunk && input.clampedMaterial;
  const headSurfacePressure = hasHeadSurface
    ? calculateSurfacePressure(
        input.preload,
        input.screw,
        input.clampedMaterial!,
        input.headWasher ? input.headWasher.outerDiameter : input.bearingOD,
        input.headWasher ? input.headWasher.innerDiameter : input.bearingID,
      )
    : null;

  const nutSurfacePressure = input.assemblyType === 'through-nut' && input.tappedMaterial && input.nut
    ? calculateSurfacePressure(
        input.preload,
        input.screw,
        input.tappedMaterial,
        input.nutWasher ? input.nutWasher.outerDiameter : input.nut.bearingDiameter,
        input.nutWasher ? input.nutWasher.innerDiameter : input.screw.holeDiameter,
      )
    : null;

  const threadStripping = input.assemblyType !== 'through-nut' && input.tappedMaterial && input.engagementLength > 0
    ? calculateThreadStripping(input.preload, input.screw, input.tappedMaterial, input.engagementLength, input.grade, input.receiverPreset)
    : null;

  const jointStiffness = input.clampedMaterial && input.clampLength > 0
    ? calculateJointStiffness(
        input.preload,
        input.screw,
        input.clampedMaterial,
        input.clampLength,
        input.grade.name,
        input.tappedMaterial,
        input.clampLengthSplit,
      )
    : null;

  const scatter = input.friction.scatter ?? 0.2;
  const torqueMin = calculateTorque(
    input.preload,
    input.screw,
    {
      ...input.friction,
      muThread: input.friction.muThread * (1 - scatter),
      muHead: input.friction.muHead * (1 - scatter),
    },
    input.bearingOD,
    input.bearingID,
  );

  const torqueMax = calculateTorque(
    input.preload,
    input.screw,
    {
      ...input.friction,
      muThread: input.friction.muThread * (1 + scatter),
      muHead: input.friction.muHead * (1 + scatter),
    },
    input.bearingOD,
    input.bearingID,
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
    input.bearingOD,
    input.bearingID,
  );

  const operatingState = jointStiffness
    ? calculateOperatingState({
        servicePreload: servicePreload.service.preloadNominal,
        axialLoad: input.axialServiceLoad,
        shearLoad: input.shearServiceLoad,
        loadFactor: jointStiffness.loadFactor,
        interfaceFriction: input.slipFriction,
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
