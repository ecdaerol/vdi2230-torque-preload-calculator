// Package entry point — re-exports the public API.
// This file only re-exports; it does not modify any source modules.

// Calculation engine
export * from './calc/torque';
export * from './calc/surfacePressure';
export * from './calc/threadStripping';
export * from './calc/jointStiffness';
export * from './calc/operatingState';

// Data
export * from './data/screws';
export * from './data/materials';
export * from './data/friction';
export * from './data/nuts';
export * from './data/washers';
export * from './data/receivers';

// React components
export * from './components/Calculator';
export * from './components/Results';
export * from './components/AssemblyDiagram';
export * from './components/JointDiagram';
export * from './components/MaterialSelector';
export * from './components/ScrewSelector';
export * from './components/ErrorBoundary';

// Full app shell (default export → named re-export)
export { default as TorqueApp } from './App';
export type { CalculationInput, CalculationResult } from './App';
