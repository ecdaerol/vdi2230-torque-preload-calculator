# Model assumptions and limits

This calculator is intended for practical engineering estimation and comparison.

## Core assumptions

- Thread profile assumes standard 60° metric/UN geometry approximations.
- Tightening torque model uses simplified VDI-style decomposition:
  - pitch term
  - thread-friction term
  - under-head / under-nut friction term
- Joint stiffness uses conical compression approximation with optional two-layer stack in series.
- Thread stripping model uses simplified shear-area engagement factors and receiver capacity factors.
- Operating load model assumes single-bolt load share from stiffness factor `n` and simple slip/shear checks.

## Validation boundaries in app

- Friction coefficients are bounded in [0.01, 1.0].
- Scatter values are bounded in [0, 1].
- Relaxation loss is bounded in [0, 100] %.
- Loads, torque, preload, clamp length, and engagement must be non-negative finite values.

## Not modeled

- Full VDI 2230 workflow depth (fatigue spectrum, multi-bolt flange coupling, FE load import).
- Thermal preload shift, detailed embedment evolution, and advanced plasticity.
- Supplier-specific geometry/coating deviations unless manually represented.

## Recommended verification for critical joints

- Confirm actual hardware dimensions and tolerance class.
- Confirm lubrication/coating batch and process scatter by test.
- Validate preload retention over temperature/time for creep-sensitive materials.
- Confirm slip and fatigue behavior with representative assemblies.
