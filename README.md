# VDI 2230 Torque & Preload Calculator

**Engineering-grade bolt tightening torque calculator for metric fasteners in soft materials.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build](https://img.shields.io/github/actions/workflow/status/ecdaerol/vdi2230-torque-preload-calculator/deploy.yml?branch=main)](https://github.com/ecdaerol/vdi2230-torque-preload-calculator/actions)
[![Deployed on GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://ecdaerol.github.io/vdi2230-torque-preload-calculator/)

---

## Overview

Most online torque calculators give you a single number for steel-on-steel assemblies and call it a day. If you are fastening into 3D-printed PA12, PEEK, or aluminum with Torx screws, those tables are useless — or dangerous.

This calculator implements the **VDI 2230** tightening torque method with first-class support for:

- **Soft clamped materials** — polymers, composites, and 3D-printed parts where surface pressure is the governing failure mode
- **Torx and hex socket fasteners** — the standards actually used in precision assemblies, not hex-head bolts
- **Small metric sizes** — M1.6 through M12, the range where most product-design bolted joints live

It computes tightening torque, preload force, surface pressure (head and nut side), thread stripping safety, joint stiffness, and load introduction factor — then visualizes the assembly and joint diagram in real time.

**Who is this for?** Mechanical engineers and product designers who need to torque-spec bolted joints in plastic housings, aluminum enclosures, 3D-printed fixtures, and mixed-material assemblies — and want to understand the safety margins before reaching for a torque driver.

---

## Live Demo

**[https://ecdaerol.github.io/vdi2230-torque-preload-calculator/](https://ecdaerol.github.io/vdi2230-torque-preload-calculator/)**

No install required. Runs entirely in the browser — no data leaves your machine.

---

## Features

### VDI 2230 Tightening Torque

The core calculation follows the VDI 2230 simplified method:

```
T = F_V × (0.16·p + 0.58·d₂·μₜₕ + D_km/2·μₕ)
```

Where:
| Symbol | Description |
|--------|-------------|
| `T` | Tightening torque [N·m] |
| `F_V` | Bolt preload force [N] |
| `p` | Thread pitch [mm] |
| `d₂` | Pitch diameter [mm] |
| `μₜₕ` | Thread friction coefficient |
| `D_km` | Mean bearing diameter = (d_w + d_h) / 2 [mm] |
| `μₕ` | Head (or nut) bearing friction coefficient |

The formula is also inverted: given a torque, the calculator solves for preload.

### Bidirectional: Utilization Drives Everything

Instead of entering torque or preload directly, you set a **target bolt utilization** (10–100%+). The calculator derives preload from the bolt's proof stress and stress area, then computes the corresponding torque. This approach matches how engineers actually spec joints: "I want 70% utilization of an M4 A2-70 screw."

### Three Assembly Scenarios

| Scenario | Description |
|----------|-------------|
| **Bolt into tapped hole** | Screw threads directly into the bottom part. Thread stripping check applies. |
| **Through-bolt with nut** | Bolt passes through both parts; clamping via nut. Surface pressure checked on both head and nut side. Thread stripping N/A. |
| **Through standoff** | Bolt passes through top part and a standoff spacer, then threads into the bottom part. Standoff length is configurable. |

### Surface Pressure Check (Head Side and Nut Side)

```
p = F_V / (π/4 × (d_w² - d_h²))
```

Compares bearing pressure against the clamped material's yield strength. Safety factor is computed with status indicators:
- **OK** (SF >= 1.5) — green
- **WARNING** (1.0 <= SF < 1.5) — amber
- **DANGER** (SF < 1.0) — red

When a washer is selected, the washer's outer/inner diameters replace the screw head geometry, distributing load over a larger bearing area — critical for soft materials.

For through-bolt assemblies, nut-side surface pressure is checked independently using the nut bearing diameter (or nut washer, if selected).

### Thread Stripping Check

```
F_strip = π · d₃ · L_e · C · τ_material
```

Where:
| Symbol | Description |
|--------|-------------|
| `d₃` | Minor diameter of internal thread [mm] |
| `L_e` | Thread engagement length [mm] |
| `C` | Thread engagement factor (0.64) |
| `τ_material` | Shear strength of the tapped material [MPa] |

The calculator reports the stripping force, safety factor, and **minimum engagement length for SF >= 1.5**. Only applies to tapped-hole and standoff assemblies (not through-bolt with nut).

### Joint Stiffness (VDI 2230 Cone Model)

**Bolt stiffness:**
```
k_b = E_bolt × A_s / L_clamp
```

**Clamp stiffness** (simplified VDI pressure-cone method):
```
k_c = (E_c · d_w · π · tan α) / ln((D_A + d_h)(d_w - d_h) / ((D_A - d_h)(d_w + d_h)))
```

Where:
- `α = 30°` (pressure cone half-angle per VDI 2230)
- `D_A = d_w + L_clamp · tan α` (substitution diameter at cone base)
- `E_bolt = 210,000 MPa` (steel bolt assumed)

**Load introduction factor:**
```
n = k_b / (k_b + k_c)
```

A low load factor means the clamped parts are much stiffer than the bolt — external loads will barely change bolt tension. A high load factor (common with polymer clamp parts) means external loads transfer significantly to the bolt.

### Interactive Joint Diagram

A real-time **force vs. deformation** chart (Recharts) showing:
- Bolt force line (slope = k_b)
- Clamp force line (starts at preload, decreases as bolt extends)
- Preload reference line (F_V)

The diagram updates instantly as you change any input parameter.

### Dynamic SVG Assembly Cross-Section

A parametric SVG drawing that renders the complete bolted joint in cross-section, including:
- Screw head (pan, countersunk, socket cap, set screw, or shoulder bolt — classified from the selected standard)
- Screw shank and thread pattern (zigzag rendering)
- Clamped part with through-hole (color-coded by material category)
- Tapped part or through-hole bottom part
- Washers under head and/or nut
- Hex nut (trapezoid cross-section) for through-bolt assemblies
- Standoff spacer with internal threads
- Dimension lines for clamp length, engagement length, head diameter, hole diameter, and washer diameters
- Material legend

### Washer Support

Three ISO washer standards, auto-filtered by screw size:

| Standard | Type | Sizes | Notes |
|----------|------|-------|-------|
| ISO 7089 | Normal series | M1.6 – M12 | General purpose |
| ISO 7092 | Small series | M1.6 – M12 | Reduced OD |
| ISO 7093-1 | Large series | M3 – M12 | Increased OD for soft materials |

Selecting a washer updates the bearing area used in the surface pressure calculation and adjusts the assembly diagram accordingly.

### Nut Support

| Standard | Type | Sizes |
|----------|------|-------|
| ISO 4032 | Hex nut (style 1) | M1.6 – M12 |
| ISO 4035 | Thin hex nut (jam nut) | M2 – M12 |

Nuts are only available in the "Through + Nut" assembly mode.

### Bolt Grades

Five common bolt property classes:

| Grade | Proof Stress (Rp0.2) |
|-------|----------------------|
| 8.8 | 640 MPa |
| 10.9 | 940 MPa |
| 12.9 | 1100 MPa |
| A2-70 | 450 MPa |
| A4-80 | 600 MPa |

### Metric / Imperial Unit Toggle

Switch output between **N and N-m** (metric) or **lbf and lb-ft** (imperial). All internal calculations remain metric; conversion is applied at display time.

### Responsive Design

Two-column layout on desktop (inputs left, results + diagrams right), single-column on mobile. Tailwind CSS utility classes throughout.

---

## Screw Database

Six ISO standards, M1.6 through M12. Each entry includes nominal diameter, pitch, pitch diameter (d₂), minor diameter (d₃), tensile stress area (A_s), head diameter, head height, drive type/size, and clearance hole diameter.

| Standard | Type | Sizes | Head | Drive | Notes |
|----------|------|-------|------|-------|-------|
| **ISO 14580** | Low head cap screw | M1.6 – M12 | Low cylindrical | Torx T5 – T50 | Reduced head height |
| **ISO 14581** | Countersunk flat head | M1.6 – M12 | Flat (flush) | Torx T5 – T50 | Countersunk recess in part |
| **ISO 14583** | Pan head | M1.6 – M12 | Pan (domed) | Torx T5 – T50 | General purpose |
| **ISO 4762** | Socket head cap screw | M1.6 – M12 | Cylindrical | Hex socket 1.5 – 10 mm | Industry standard SHCS |
| **ISO 4026** | Set screw | M1.6 – M12 | None | Hex socket 0.7 – 6 mm | Headless, no bearing surface |
| **ISO 7379** | Shoulder bolt | M4 – M12 | Cylindrical | Hex socket 3 – 10 mm | Shoulder diameters 5 – 16 mm |

### Thread Data (Metric Coarse)

| Size | Pitch [mm] | d₂ [mm] | d₃ [mm] | A_s [mm²] |
|------|-----------|---------|---------|-----------|
| M1.6 | 0.35 | 1.373 | 1.171 | 1.27 |
| M2 | 0.4 | 1.740 | 1.509 | 2.07 |
| M2.5 | 0.45 | 2.208 | 1.948 | 3.39 |
| M3 | 0.5 | 2.675 | 2.387 | 5.03 |
| M4 | 0.7 | 3.545 | 3.141 | 8.78 |
| M5 | 0.8 | 4.480 | 4.019 | 14.2 |
| M6 | 1.0 | 5.350 | 4.773 | 20.1 |
| M8 | 1.25 | 7.188 | 6.466 | 36.6 |
| M10 | 1.5 | 9.026 | 8.160 | 58.0 |
| M12 | 1.75 | 10.863 | 9.853 | 84.3 |

---

## Material Database

14 materials across four categories. Each includes elastic modulus (E), yield strength (σy), shear strength (τ), and Poisson's ratio (ν).

### Metals

| Material | E [GPa] | σy [MPa] | τ [MPa] | ν | Notes |
|----------|---------|----------|---------|------|-------|
| Aluminum 6061-T6 | 69 | 276 | 207 | 0.33 | Machined, general purpose |
| Aluminum 7075-T6 | 72 | 503 | 331 | 0.33 | Machined, high strength |
| Aluminum 5083-H321 | 70 | 228 | 145 | 0.33 | Machined, marine grade |
| Steel (generic) | 210 | 250 | 150 | 0.30 | Mild steel reference |
| Stainless 304 (1.4301) | 193 | 215 | 170 | 0.29 | Austenitic stainless |
| Stainless 303 (1.4305) | 193 | 240 | 180 | 0.29 | Free-machining stainless |

### Engineering Polymers

| Material | E [GPa] | σy [MPa] | τ [MPa] | ν | Notes |
|----------|---------|----------|---------|------|-------|
| PEEK (unfilled) | 3.5 | 100 | 55 | 0.40 | Injection molded |
| POM (Delrin) | 2.9 | 65 | 40 | 0.35 | Acetal |
| PEI (Ultem) | 3.3 | 85 | 50 | 0.36 | High-temp polymer |

### 3D-Printed Polymers

| Material | E [GPa] | σy [MPa] | τ [MPa] | ν | Notes |
|----------|---------|----------|---------|------|-------|
| PA12 (SLS/MJF) | 1.7 | 48 | 28 | 0.39 | HP MJF / EOS SLS |
| PA12 (FDM) | 1.2 | 35 | 20 | 0.39 | Layer adhesion dependent |
| PA12 GF (SLS) | 3.2 | 51 | 30 | 0.35 | Glass-filled, 3D printed |

### Composites

| Material | E [GPa] | σy [MPa] | τ [MPa] | ν | Notes |
|----------|---------|----------|---------|------|-------|
| PEEK (30% CF) | 12 | 210 | 100 | 0.38 | Carbon fiber filled |
| PA6 GF30 | 9.5 | 185 | 95 | 0.35 | 30% glass-filled polyamide 6 |

A **custom material** option allows entering arbitrary E, σy, τ, and ν values.

---

## Friction Pairs

18 pre-defined friction pairs covering steel, stainless, and polymer contact surfaces. Each pair specifies independent thread friction (μₜₕ) and head bearing friction (μₕ).

| Pair | Condition | μₜₕread | μₕead |
|------|-----------|----------|--------|
| Steel on Steel | Dry | 0.12 | 0.12 |
| Steel on Steel | Oiled | 0.10 | 0.10 |
| Steel on Steel | MoS₂ | 0.08 | 0.08 |
| Steel on Steel | Waxed | 0.10 | 0.10 |
| Steel on Aluminum | Dry | 0.15 | 0.15 |
| Steel on Aluminum | Oiled | 0.12 | 0.12 |
| Stainless on Stainless | Dry | 0.18 | 0.18 |
| Stainless on Aluminum | Dry | 0.16 | 0.16 |
| Stainless on PEEK | Dry | 0.12 | 0.18 |
| Stainless on PA12 | Dry | 0.15 | 0.20 |
| Stainless on POM | Dry | 0.10 | 0.15 |
| Stainless on PEI | Dry | 0.14 | 0.18 |
| Steel on PEEK | Dry | 0.12 | 0.18 |
| Steel on PA12 | Dry | 0.15 | 0.20 |
| Steel on POM | Dry | 0.10 | 0.15 |
| Any | Loctite 222 (low) | 0.12 | 0.12 |
| Any | Loctite 243 (medium) | 0.14 | 0.14 |
| Custom | User-defined | 0.14 | 0.14 |

Both μₜₕread and μₕead can be overridden manually with arbitrary values regardless of the selected pair.

---

## Calculation Reference

### Tightening Torque (VDI 2230)

The torque required to achieve a target preload F_V accounts for three resistance terms:

```
T = F_V × (0.16·p + 0.58·d₂·μₜₕ + D_km/2·μₕ)
```

- **0.16·p** — torque to overcome thread helix (pitch-dependent axial advance)
- **0.58·d₂·μₜₕ** — torque to overcome thread friction at the pitch diameter
- **D_km/2·μₕ** — torque to overcome under-head (or under-nut) bearing friction

The constant 0.16 approximates `tan(λ)/(2π)` for standard metric coarse threads, and 0.58 approximates `1/(2·cos(30°))` for the 60° thread flank angle. D_km = (d_w + d_h) / 2 is the mean bearing diameter.

Typically only 10–15% of applied torque generates useful preload. The remainder is consumed by thread and head friction.

### Surface Pressure (Bearing Stress)

```
p = F_V / A_bearing
A_bearing = π/4 × (d_w² - d_h²)
```

Where d_w is the bearing surface outer diameter (head, washer, or nut) and d_h is the hole (or washer inner) diameter. The safety factor is:

```
SF = σ_y(material) / p
```

For polymer parts, this is almost always the limiting constraint. Use ISO 7093-1 large-series washers to increase bearing area.

### Thread Stripping (Internal Thread Shear)

```
F_strip = π · d₃ · L_e · C · τ_material
```

With C = 0.64 (thread engagement factor accounting for load distribution across threads). The minimum engagement length for a target safety factor of 1.5 is:

```
L_e,min = 1.5 · F_V / (π · d₃ · C · τ_material)
```

Rule of thumb: engagement length should be at least 1.5d in metals and 2–2.5d in polymers.

### Joint Stiffness (Bolt and Clamp)

**Bolt stiffness** treats the bolt shank as a tension bar:

```
k_b = E_bolt · A_s / L_clamp
```

**Clamp stiffness** uses the VDI 2230 pressure-cone model with a 30° half-angle:

```
D_A = d_w + L_clamp · tan(30°)
k_c = (E_clamp · d_w · π · tan(30°)) / ln(((D_A + d_h)(d_w - d_h)) / ((D_A - d_h)(d_w + d_h)))
```

The **load introduction factor** n = k_b / (k_b + k_c) determines what fraction of any external axial load is carried by the bolt. For stiff metal joints n is typically 0.1–0.2. For polymer joints n can reach 0.5 or higher, meaning the bolt sees a large fraction of external loads.

---

## Assembly Scenarios

### Bolt into Tapped Hole

```
        ┌──────────┐
        │  ▓ head ▓ │
   ┌────┴──┬────┬──┴────┐
   │  top  │bolt│  top  │  ← clamped part (through-hole)
   │ part  │    │ part  │
   ├───────┼┼┼┼┼┼───────┤
   │ bottom│bolt│bottom │  ← tapped part (threaded hole)
   │ part  │    │ part  │
   └───────┴────┴───────┘
```

The screw threads directly into the bottom part. Thread stripping is checked against the tapped material's shear strength. Surface pressure is checked on the head side against the clamped material.

### Through-Bolt with Nut

```
        ┌──────────┐
        │  ▓ head ▓ │
   ┌────┴──┬────┬──┴────┐
   │  top  │bolt│  top  │  ← clamped part
   │ part  │    │ part  │
   ├───────┼────┼───────┤
   │ bottom│bolt│bottom │  ← bottom part (through-hole)
   │ part  │    │ part  │
   └───────┼────┼───────┘
        ┌──┴────┴──┐
        │  ⬡ nut ⬡ │
        └──────────┘
```

Both parts have clearance holes. Clamping is via a nut on the bottom. Surface pressure is checked independently on the head side (against clamped material) and nut side (against bottom material). Thread stripping is N/A. Washers can be placed under both head and nut.

### Through Standoff

```
        ┌──────────┐
        │  ▓ head ▓ │
   ┌────┴──┬────┬──┴────┐
   │  top  │bolt│  top  │  ← clamped part (through-hole)
   │ part  │    │ part  │
   ├───────┼────┼───────┤
   │standof│bolt│stndoff│  ← standoff spacer (internally threaded)
   ├───────┼┼┼┼┼┼───────┤
   │ bottom│bolt│bottom │  ← bottom part (tapped hole)
   │ part  │    │ part  │
   └───────┴────┴───────┘
```

The bolt passes through the top part and a standoff spacer, then threads into the bottom part. Standoff length is a separate input. Thread stripping is checked in the bottom part.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | React | 18.3 |
| Language | TypeScript | 5.5 |
| Build tool | Vite | 5.3 |
| Styling | Tailwind CSS | 3.4 |
| Charts | Recharts | 2.12 |
| Hosting | GitHub Pages | via GitHub Actions |

Zero runtime dependencies beyond React and Recharts. No server, no database, no API calls.

---

## Getting Started

```bash
git clone https://github.com/ecdaerol/vdi2230-torque-preload-calculator.git
cd vdi2230-torque-preload-calculator
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

The production build outputs to `dist/`.

---

## Project Structure

```
torque-calc/
├── src/
│   ├── App.tsx                        # App shell (header, footer, layout)
│   ├── components/
│   │   ├── Calculator.tsx             # Main UI: inputs, assembly type toggle, state management
│   │   ├── Results.tsx                # Results panel: torque, preload, safety checks, stiffness
│   │   ├── AssemblyDiagram.tsx        # Parametric SVG cross-section of the bolted joint
│   │   ├── JointDiagram.tsx           # Force vs. deformation chart (Recharts)
│   │   ├── ScrewSelector.tsx          # Two-stage picker: standard → size
│   │   └── MaterialSelector.tsx       # Grouped dropdown with custom material input
│   ├── calc/
│   │   ├── torque.ts                  # VDI 2230 torque/preload formulas + bolt grades
│   │   ├── surfacePressure.ts         # Bearing pressure under head/nut/washer
│   │   ├── threadStripping.ts         # Internal thread shear capacity
│   │   └── jointStiffness.ts          # Bolt/clamp stiffness, load factor, diagram data
│   └── data/
│       ├── screws.ts                  # 56 screws across 6 ISO standards
│       ├── materials.ts               # 14 materials (metals, polymers, composites)
│       ├── friction.ts                # 18 friction pairs
│       ├── washers.ts                 # 27 washers across 3 ISO standards
│       └── nuts.ts                    # 19 nuts across 2 ISO standards
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## Deployment

The app is deployed to **GitHub Pages** via GitHub Actions. On every push to `main`:

1. `npm ci` installs dependencies
2. `tsc && vite build` compiles TypeScript and produces an optimized static build
3. The `dist/` folder is deployed to the `gh-pages` branch

The live site is available at:
**https://ecdaerol.github.io/vdi2230-torque-preload-calculator/**

---

## Limitations & Disclaimer

This tool implements a **simplified subset** of VDI 2230. The following are explicitly **not** covered:

- **Systematic VDI 2230 method** — The full standard includes thermal preload loss, embedding, eccentricity, and more. This calculator covers the tightening torque formula and basic safety checks only.
- **Dynamic loading / fatigue** — No alternating stress analysis, no Haigh diagram, no endurance limit check. The calculator assumes static loading.
- **Thermal effects** — No differential thermal expansion between bolt and clamped parts.
- **Torsional stress in bolt** — The combined tension + torsion stress state during tightening is not evaluated.
- **Eccentric loading** — Bolt loading is assumed concentric and axial.
- **Creep and relaxation** — Polymer clamp parts lose preload over time. This is not modeled.
- **Fine-pitch threads** — Only metric coarse pitch is included.

**This calculator is for reference and preliminary design only.** Safety-critical and structurally loaded bolted joints must be verified by a qualified engineer using the full VDI 2230 method or equivalent analysis. The authors accept no liability for designs based on these results.

---

## Contributing

Contributions are welcome. To add a screw standard, material, or friction pair:

1. Fork the repository
2. Add entries to the relevant file in `src/data/`
3. Ensure TypeScript compiles cleanly (`npm run build`)
4. Submit a pull request with a description of the data source

For calculation changes, please reference the relevant section of VDI 2230 or provide an equivalent engineering reference.

---

## macOS Desktop App Packaging

For local desktop delivery on macOS, package the calculator as a **single self-contained `.app` bundle** with:

- the provided branded icon
- a **Swiss-flag red** icon background
- embedded `dist/` assets inside the app bundle (no separate companion folder on the Desktop)

Build it after `npm run build` with:

```bash
./scripts/build-macos-app.sh
```

This produces:
- a Desktop `.app` bundle for local use
- a single `.zip` file for easy sharing inside the company

The app serves the embedded static build locally and opens it in the browser, avoiding the blank page issue that occurs when the Vite build is opened directly from `file://`.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
