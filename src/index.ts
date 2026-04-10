import "./index.css";

// Package entry point — re-exports the public API.
// This file only re-exports; it does not modify any source modules.

// Calculation engine
export * from './calc/torque';
export * from './calc/surfacePressure';
export * from './calc/threadStripping';
export * from './calc/jointStiffness';
export * from './calc/operatingState';
export * from './calc/preloadRealism';

// Data
export * from './data/screws';
export * from './data/materials';
export * from './data/friction';
export * from './data/nuts';
export * from './data/washers';
export * from './data/receivers';

// React components (default exports → named re-exports)
export { default as Calculator } from './components/Calculator';
export { default as Results } from './components/Results';
export { default as AssemblyDiagram } from './components/AssemblyDiagram';
export { default as JointDiagram } from './components/JointDiagram';
export { default as MaterialSelector } from './components/MaterialSelector';
export { default as ScrewSelector } from './components/ScrewSelector';
export { default as ErrorBoundary } from './components/ErrorBoundary';

// Full app shell
export { default as TorqueApp } from './App';
