import type { ScrewData } from '../data/screws';
import type { BoltGrade } from './torque';

export interface OperatingStateInput {
  servicePreload: number;
  axialLoad: number;
  shearLoad: number;
  loadFactor: number;
  interfaceFriction: number;
  screw: ScrewData;
  grade: BoltGrade;
}

export interface OperatingStateResult {
  boltLoadShare: number;
  clampLoadShare: number;
  additionalBoltLoad: number;
  clampForceLoss: number;
  remainingClampForce: number;
  separationLoad: number;
  separationMargin: number;
  isSeparated: boolean;
  boltForceUnderAxialLoad: number;
  availableSlipResistance: number;
  slipSafetyFactor: number;
  willSlip: boolean;
  shearArea: number;
  shearStress: number;
  shearAllowable: number;
  shearSafetyFactor: number;
}

export function calculateOperatingState({
  servicePreload,
  axialLoad,
  shearLoad,
  loadFactor,
  interfaceFriction,
  screw,
  grade,
}: OperatingStateInput): OperatingStateResult {
  const boltLoadShare = Math.max(0, Math.min(1, loadFactor));
  const clampLoadShare = 1 - boltLoadShare;

  const separationLoad = clampLoadShare > 0 ? servicePreload / clampLoadShare : Number.POSITIVE_INFINITY;
  const remainingClampForce = Math.max(0, servicePreload - clampLoadShare * axialLoad);
  const isSeparated = axialLoad > 0 && remainingClampForce <= 0;
  const separationMargin = axialLoad > 0 ? separationLoad / axialLoad : Number.POSITIVE_INFINITY;

  const axialLoadBeforeSeparation = Math.min(axialLoad, separationLoad);
  const additionalBoltLoad = boltLoadShare * axialLoadBeforeSeparation + Math.max(0, axialLoad - separationLoad);
  const clampForceLoss = servicePreload - remainingClampForce;
  const boltForceUnderAxialLoad = servicePreload + additionalBoltLoad;

  const availableSlipResistance = Math.max(0, interfaceFriction) * remainingClampForce;
  const slipSafetyFactor = shearLoad > 0 ? availableSlipResistance / shearLoad : Number.POSITIVE_INFINITY;
  const willSlip = shearLoad > 0 && availableSlipResistance < shearLoad;

  const effectiveDiameter = screw.shoulderDiameter ?? screw.d;
  const shearArea = Math.PI * effectiveDiameter * effectiveDiameter / 4;
  const shearStress = shearLoad > 0 ? shearLoad / shearArea : 0;
  const shearAllowable = 0.58 * grade.Rp02;
  const shearSafetyFactor = shearStress > 0 ? shearAllowable / shearStress : Number.POSITIVE_INFINITY;

  return {
    boltLoadShare,
    clampLoadShare,
    additionalBoltLoad,
    clampForceLoss,
    remainingClampForce,
    separationLoad,
    separationMargin,
    isSeparated,
    boltForceUnderAxialLoad,
    availableSlipResistance,
    slipSafetyFactor,
    willSlip,
    shearArea,
    shearStress,
    shearAllowable,
    shearSafetyFactor,
  };
}
