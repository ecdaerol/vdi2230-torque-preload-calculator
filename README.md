# Fastener Joint Calculator

A browser-based engineering tool for estimating **tightening torque**, **preload**, **service preload after losses**, **surface pressure**, **thread stripping**, and **joint stiffness** for a wide range of real-world fastener joints.

It is intentionally positioned between a simple torque table and a heavy full VDI package:
- faster and friendlier than enterprise bolt-design suites
- more realistic and configurable than one-number online torque calculators

> **Important:** this app is for engineering estimation and concept/design support. Critical joints still require validation with the exact hardware, coating, material condition, temperature, and tightening process.

---

## What it does

The calculator uses a simplified VDI-style tightening model to estimate:

- tightening torque from preload
- preload from tightening torque
- bolt stress / utilization including torsion
- head-side and nut-side surface pressure
- thread stripping margin for tapped joints
- joint stiffness and load factor
- preload band from tightening scatter
- **service preload** after relaxation and settlement / embedding loss

It also renders:
- a live assembly cross-section
- a joint force/deformation plot

---

## Key capabilities

### Broader fastener coverage
The app now supports a broader engineering hardware set:

#### Metric families
- ISO 14580 — low head cap screw Torx
- ISO 14581 — countersunk flat head Torx
- ISO 14583 — pan head Torx
- ISO 4762 — socket head cap screw
- ISO 7380-1 — button head socket screw
- ISO 4017 — hex head screw
- ISO 4014 — partially threaded hex bolt
- ISO 4026 — set screw
- ISO 7379 — shoulder bolt

#### Inch families
- ASME B18.3 — socket head cap screw (practical UNC / UNF subset)
- ASME B18.2.1 — hex cap screw (practical UNC / UNF subset)

### Expanded support hardware
#### Nuts
- ISO 4032 hex nuts
- ISO 4035 thin hex nuts
- ISO 4161 flange nuts
- ISO 7040 nylon insert lock nuts
- ASME B18.2.2 inch hex nuts

#### Washers
- ISO 7089 normal
- ISO 7092 small
- ISO 7093-1 large
- extra-wide support washers
- ANSI SAE flat washers
- ANSI USS wide washers

### Expanded material library
The material library now covers a broader product-development space:
- aluminum alloys
- steels and stainless
- brass / copper / titanium
- engineering polymers
- 3D-printing materials
- laminates and reinforced polymers
- custom user-defined materials

### Interface-condition presets
The friction / interface library now includes a much broader set of presets, including:
- dry
- oiled
- waxed
- MoS₂
- anti-seize
- zinc plated
- black oxide + oiled
- zinc flake / Geomet
- anodized aluminum
- passivated stainless
- threadlocker presets

### Preload realism
To better reflect real assemblies, the app now models:
- tightening-method scatter
- friction-condition scatter
- preload band (min / nominal / max)
- relaxation loss
- settlement / embedding loss
- service preload after losses

---

## Intended use cases

This app is especially useful for:
- machined aluminum housings
- electronics and PCB stacks
- polymer enclosures
- mixed-material assemblies
- prototype and fixture design
- quick comparison of hardware/material combinations before detailed validation

---

## Calculation scope

The tool intentionally stays in the “practical engineering calculator” lane.

It **does include**:
- preload / torque estimation
- bolt stress with torsion
- clamp-bearing pressure
- thread stripping
- joint stiffness and load factor
- preload-loss estimation from settlement and relaxation

It **does not try to fully replace**:
- advanced VDI 2230 expert workflows
- multi-bolt flange analysis
- FE force import
- deep fatigue / spectrum analysis
- code-compliance packages such as full Eurocode structural bolting workflows

---

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- Vitest
- Recharts

---

## Local development

```bash
npm install
npm run dev
```

### Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

---

## macOS app bundle

A lightweight macOS `.app` wrapper is included for local desktop delivery.

Build it with:

```bash
./scripts/build-macos-app.sh
```

The script outputs:
- a self-contained `.app` bundle on the Desktop
- a `.zip` share package next to it

---

## Notes on accuracy

This app stores all geometry internally in **millimetres**, including the inch fastener families. Inch thread sizes are represented with common UN geometry approximations suitable for early sizing and comparative engineering work.

For critical joints, always verify:
- exact hardware standard / supplier geometry
- actual coating / lubricant batch
- tightening-tool calibration
- part stiffness and settlement behavior
- temperature and time-dependent preload loss

---

## License

MIT
