# Changelog

All notable changes to the Fastener Joint Calculator are documented here.

## [Unreleased]

### Added
- **Orchestration layer** (`computeResults.ts`) — single entry point for all calculation logic
- **Input validation** (`validation.ts`) — runtime checks with user-friendly errors and warnings
- **Golden regression tests** — 3 reference cases (M8 steel, M12 through-bolt, M4 aluminum) to catch unintended changes
- **Model assumptions doc** (`docs/model-assumptions.md`) — VDI 2230 scope and limitations
- **Linux desktop target** — AppImage builds via electron-builder
- **OpenGraph / Twitter meta tags** in `index.html`
- **Dark scrollbar** for embed mode
- **Footer link** to ecdaerol.com

### Fixed
- **Thread stripping**: use governing mode (min of internal vs external engagement area)
- **Through-bolt bearing geometry**: turned-side concept routes nut OD/ID for nut-turned assemblies
- **Joint stiffness**: use actual bearing diameter including washers instead of hardcoded head diameter
- **Shear area**: use minor/stress diameter for threaded shear planes (conservative, per VDI 2230)
- **Slip interfaces**: configurable count instead of hardcoded 1

## [1.0.0] — 2026-04-11

### Added
- **Assembly-level utilization** — slider targets weakest failure mode across bolt yield, surface pressure, and thread stripping
- **Hex standoff support** — M2–M5 metric and #4-40–#10-24 inch standoffs as screws and nuts
- **Dark mode theme system** — 13 CSS custom properties with `.embed-dark` overrides
- **Calculator refactor** — split into `useCalculatorState` hook + 5 sub-components (740 → 220 lines)
- **Memoization** — 7 calculation calls wrapped in `useMemo`
- **Form accessibility** — `id/htmlFor` pairs on 30+ elements, `aria-labels` on toggle buttons
- **Assembly diagram rework** — correct nut shape, distinct colors (blue-gray/gold/bronze), flush parts

### Fixed
- Head-washer visual gap in assembly diagram
- Standoff diagram: no clamped part, taller hex body
- White-on-white in dark mode embed
- Assembly diagram layout regression (tappedTop/tappedBot)

## [0.9.0] — 2026-04-10

### Added
- Initial public release
- VDI 2230–based torque/preload calculation
- Bolt stress, surface pressure, thread stripping, joint stiffness
- Service preload with relaxation and settlement losses
- Live assembly cross-section diagram
- Joint force/deformation plot
- Dual mode: standalone web app + npm library
- Electron desktop builds (macOS + Windows)
- GitHub Pages deployment
- npm publishing via CI
