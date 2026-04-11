import type { FrictionPair } from '../data/friction';
import type { ScrewData } from '../data/screws';

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && !Number.isNaN(value);
}

export function validateNumericInput(name: string, value: number, min = -Infinity, max = Infinity): string | null {
  if (!isFiniteNumber(value)) return `${name} must be a finite number.`;
  if (value < min) return `${name} must be >= ${min}.`;
  if (value > max) return `${name} must be <= ${max}.`;
  return null;
}

export function validateCoreInputs(params: {
  screw: ScrewData | null;
  preload: number;
  torque: number;
  friction: FrictionPair;
  clampLength: number;
  engagementLength: number;
  relaxationLossPct: number;
  settlementMicrons: number;
  slipFriction: number;
  axialServiceLoad: number;
  shearServiceLoad: number;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const {
    screw,
    preload,
    torque,
    friction,
    clampLength,
    engagementLength,
    relaxationLossPct,
    settlementMicrons,
    slipFriction,
    axialServiceLoad,
    shearServiceLoad,
  } = params;

  if (!screw) {
    errors.push('A screw must be selected before running calculations.');
    return { errors, warnings };
  }

  const checks = [
    validateNumericInput('Preload', preload, 0),
    validateNumericInput('Torque', torque, 0),
    validateNumericInput('Clamp length', clampLength, 0),
    validateNumericInput('Engagement length', engagementLength, 0),
    validateNumericInput('Relaxation loss', relaxationLossPct, 0, 100),
    validateNumericInput('Settlement', settlementMicrons, 0),
    validateNumericInput('Slip friction', slipFriction, 0, 1),
    validateNumericInput('Axial service load', axialServiceLoad, 0),
    validateNumericInput('Shear service load', shearServiceLoad, 0),
    validateNumericInput('Thread friction', friction.muThread, 0.01, 1),
    validateNumericInput('Head friction', friction.muHead, 0.01, 1),
    validateNumericInput('Friction scatter', friction.scatter, 0, 1),
  ];

  for (const check of checks) {
    if (check) errors.push(check);
  }

  if (screw.holeDiameter >= screw.headDiameter && screw.hasHead && !screw.isCountersunk) {
    warnings.push('Hole diameter is greater than or equal to head bearing diameter; bearing-area outputs may be non-physical.');
  }

  if (engagementLength > 0 && engagementLength < screw.pitch) {
    warnings.push('Thread engagement is below one pitch. Thread stripping predictions should be treated as high risk.');
  }

  if (clampLength > 0 && clampLength > 12 * screw.d) {
    warnings.push('Clamp length is very large relative to nominal screw diameter; stiffness assumptions may become less representative.');
  }

  return { errors, warnings };
}
