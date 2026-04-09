import React from 'react';
import type { ScrewData } from '../data/screws';
import type { MaterialData } from '../data/materials';
import type { WasherData } from '../data/washers';
import type { NutData } from '../data/nuts';

export type AssemblyType = 'tapped-hole' | 'through-nut' | 'standoff';

interface Props {
  assemblyType: AssemblyType;
  screw: ScrewData | null;
  clampedMaterial: MaterialData | null;
  tappedMaterial: MaterialData | null;
  headWasher: WasherData | null;
  nutWasher: WasherData | null;
  nut: NutData | null;
  clampLength: number;
  engagementLength: number;
  standoffLength?: number;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function getMaterialFill(mat: MaterialData | null): string {
  if (!mat) return '#cbd5e1';
  switch (mat.category) {
    case 'metal':     return '#93c5fd';
    case 'polymer':   return '#86efac';
    case 'composite': return '#c4b5fd';
    case 'custom':    return '#fde68a';
    default:          return '#cbd5e1';
  }
}

function getMaterialStroke(mat: MaterialData | null): string {
  if (!mat) return '#475569';
  switch (mat.category) {
    case 'metal':     return '#3b82f6';
    case 'polymer':   return '#22c55e';
    case 'composite': return '#8b5cf6';
    case 'custom':    return '#f59e0b';
    default:          return '#475569';
  }
}

// ---------------------------------------------------------------------------
// Screw head classification
// ---------------------------------------------------------------------------

type HeadStyle = 'pan' | 'countersunk' | 'socket' | 'set' | 'shoulder';

function classifyHead(screw: ScrewData): HeadStyle {
  const std = screw.standard.toLowerCase();
  const typ = screw.type.toLowerCase();
  if (std.includes('4026') || typ.includes('set screw') || typ.includes('grub')) return 'set';
  if (std.includes('7379') || typ.includes('shoulder')) return 'shoulder';
  if (std.includes('4762') || typ.includes('socket head') || typ.includes('cap screw')) return 'socket';
  if (std.includes('14581') || typ.includes('countersunk') || typ.includes('flat head')) return 'countersunk';
  return 'pan'; // ISO 14580, 14583, and fallback
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREW_FILL   = '#94a3b8';
const SCREW_STROKE = '#64748b';
const WASHER_FILL  = '#d1d5db';
const WASHER_STROKE = '#9ca3af';
const NUT_FILL     = '#9ca3af';
const NUT_STROKE   = '#6b7280';
const DIM_COLOR    = '#f97316';
const VIEW_W = 320;
const VIEW_H = 440;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AssemblyDiagram({
  assemblyType,
  screw,
  clampedMaterial,
  tappedMaterial,
  headWasher,
  nutWasher,
  nut,
  clampLength,
  engagementLength,
  standoffLength = 0,
}: Props) {
  // ---- Empty state ----
  if (!screw) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200">
          Assembly Cross-Section
        </h3>
        <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-sm">
          Select a screw to view the assembly diagram.
        </div>
      </div>
    );
  }

  // From here on `screw` is guaranteed non-null.
  const headStyle = classifyHead(screw);
  const cx = VIEW_W / 2; // horizontal centre

  // ---- Scaling ----
  // Sum up all real-mm heights so we can map them into SVG space.
  const standoffReal = assemblyType === 'standoff' ? standoffLength : 0;
  const totalReal = clampLength + engagementLength + standoffReal || 1;
  const maxBodyH = 240; // max SVG pixels for the stacked body
  const scale = Math.min(maxBodyH / totalReal, 18);

  const clampH   = Math.max(clampLength * scale, 20);
  const engageH  = Math.max(engagementLength * scale, 20);
  const standH   = assemblyType === 'standoff' ? Math.max(standoffReal * scale, 16) : 0;

  // Screw geometry (scaled)
  const dNom   = screw.d * scale;
  const headDia = screw.headDiameter * scale;
  const headH   = screw.headHeight * scale;
  const holeDia = screw.holeDiameter * scale;
  const shankR  = dNom / 2;
  const holeR   = holeDia / 2;
  const headR   = headDia / 2;

  // Washer geometry (scaled)
  const hwOD = headWasher ? headWasher.outerDiameter * scale : 0;
  const hwTh = headWasher ? Math.max(headWasher.thickness * scale, 3) : 0;
  const hwR  = hwOD / 2;

  const nwOD = nutWasher ? nutWasher.outerDiameter * scale : 0;
  const nwTh = nutWasher ? Math.max(nutWasher.thickness * scale, 3) : 0;
  const nwR  = nwOD / 2;

  // Nut geometry (scaled)
  const nutW = nut ? nut.width * scale : 0;
  const nutH = nut ? Math.max(nut.height * scale, 8) : 0;
  const nutR = nutW / 2;

  // Plate width — wide enough to contain everything
  const plateW = 200;
  const plateL = cx - plateW / 2;
  const plateR_ = cx + plateW / 2;

  // ---- Vertical layout (top to bottom) ----
  // Head sits above the body stack. For countersunk the head recesses into the clamped part.
  const bodyStart = headStyle === 'countersunk'
    ? 70
    : 70 + headH + (headWasher ? hwTh : 0);

  // Positions
  const headWasherTop = headStyle === 'countersunk' ? bodyStart - hwTh : bodyStart - hwTh;
  const clampTop = bodyStart;
  const clampBot = clampTop + clampH;

  let standoffTop = 0;
  let standoffBot = 0;
  let tappedTop = 0;
  let tappedBot = 0;

  if (assemblyType === 'standoff') {
    standoffTop = clampBot + 2;
    standoffBot = standoffTop + standH;
    tappedTop = standoffBot + 2;
    tappedBot = tappedTop + engageH;
  } else {
    tappedTop = clampBot + 2;
    tappedBot = tappedTop + engageH;
  }

  // Nut / nut-washer positions (through-nut only)
  const nutWasherTop = assemblyType === 'through-nut' ? tappedBot + 2 : 0;
  const nutTop = assemblyType === 'through-nut'
    ? nutWasherTop + (nutWasher ? nwTh : 0) + 1
    : 0;

  // Head position
  const headTop = headStyle === 'countersunk'
    ? clampTop - headH * 0.15
    : clampTop - headH - (headWasher ? hwTh : 0);

  // Colors
  const clampFill   = getMaterialFill(clampedMaterial);
  const clampStroke = getMaterialStroke(clampedMaterial);
  const tapFill     = getMaterialFill(tappedMaterial);
  const tapStroke   = getMaterialStroke(tappedMaterial);

  // Shoulder bolt extra
  const shoulderR = shankR + 6;
  const shoulderH_ = clampH * 0.3;

  // -----------------------------------------------------------------------
  // Helper: thread zigzag in a vertical region
  // -----------------------------------------------------------------------
  function renderThreads(yStart: number, yEnd: number, inset: number = 0): React.ReactNode[] {
    const lines: React.ReactNode[] = [];
    const pitch = Math.max(dNom * 0.35, 4);
    const count = Math.floor((yEnd - yStart) / pitch);
    for (let i = 0; i < count; i++) {
      const y = yStart + i * pitch + pitch * 0.5;
      if (y + pitch * 0.5 > yEnd) break;
      const sr = shankR + inset;
      lines.push(
        <polyline
          key={`tl-${yStart}-${i}`}
          points={`${cx - sr},${y} ${cx - sr - 4},${y + pitch * 0.25} ${cx - sr},${y + pitch * 0.5}`}
          stroke="#94a3b8"
          strokeWidth="1"
          fill="none"
        />,
        <polyline
          key={`tr-${yStart}-${i}`}
          points={`${cx + sr},${y} ${cx + sr + 4},${y + pitch * 0.25} ${cx + sr},${y + pitch * 0.5}`}
          stroke="#94a3b8"
          strokeWidth="1"
          fill="none"
        />,
      );
    }
    return lines;
  }

  // -----------------------------------------------------------------------
  // Screw head renderer
  // -----------------------------------------------------------------------
  function renderHead(): React.ReactNode {
    switch (headStyle) {
      case 'pan': {
        const domeH = headH * 0.35;
        const hTop = headWasher ? headWasherTop - headH : clampTop - headH;
        return (
          <path
            d={`
              M ${cx - headR} ${hTop + headH}
              L ${cx - headR} ${hTop + domeH}
              Q ${cx - headR} ${hTop}, ${cx} ${hTop}
              Q ${cx + headR} ${hTop}, ${cx + headR} ${hTop + domeH}
              L ${cx + headR} ${hTop + headH}
              Z
            `}
            fill={SCREW_FILL}
            stroke={SCREW_STROKE}
            strokeWidth="1"
          />
        );
      }
      case 'countersunk': {
        // Cone recesses into clamped part — top flush with clamped surface
        const coneBottom = clampTop + headH;
        return (
          <path
            d={`
              M ${cx - headR} ${clampTop}
              L ${cx - shankR} ${coneBottom}
              L ${cx + shankR} ${coneBottom}
              L ${cx + headR} ${clampTop}
              Z
            `}
            fill={SCREW_FILL}
            stroke={SCREW_STROKE}
            strokeWidth="1"
          />
        );
      }
      case 'socket': {
        const hTop = headWasher ? headWasherTop - headH : clampTop - headH;
        return (
          <rect
            x={cx - headR} y={hTop}
            width={headR * 2} height={headH}
            fill={SCREW_FILL} stroke={SCREW_STROKE}
            strokeWidth="1" rx="1"
          />
        );
      }
      case 'set':
        return null;
      case 'shoulder': {
        const hTop = headWasher ? headWasherTop - headH : clampTop - headH;
        return (
          <>
            <rect
              x={cx - headR} y={hTop}
              width={headR * 2} height={headH}
              fill={SCREW_FILL} stroke={SCREW_STROKE}
              strokeWidth="1" rx="1"
            />
            <rect
              x={cx - shoulderR} y={clampTop}
              width={shoulderR * 2} height={shoulderH_}
              fill={SCREW_FILL} stroke={SCREW_STROKE}
              strokeWidth="0.5"
            />
          </>
        );
      }
    }
  }

  // -----------------------------------------------------------------------
  // Washer renderer
  // -----------------------------------------------------------------------
  function renderWasher(
    y: number, washerR: number, thickness: number, key: string,
  ): React.ReactNode {
    return (
      <rect
        key={key}
        x={cx - washerR} y={y}
        width={washerR * 2} height={thickness}
        fill={WASHER_FILL} stroke={WASHER_STROKE}
        strokeWidth="1" rx="0.5"
      />
    );
  }

  // -----------------------------------------------------------------------
  // Nut renderer — trapezoid cross-section (hex viewed from side)
  // -----------------------------------------------------------------------
  function renderNut(): React.ReactNode {
    if (assemblyType !== 'through-nut' || !nut) return null;
    const inset = nutR * 0.15; // angled sides
    return (
      <path
        d={`
          M ${cx - nutR} ${nutTop}
          L ${cx - nutR + inset} ${nutTop + nutH}
          L ${cx + nutR - inset} ${nutTop + nutH}
          L ${cx + nutR} ${nutTop}
          Z
        `}
        fill={NUT_FILL} stroke={NUT_STROKE} strokeWidth="1.5"
      />
    );
  }

  // -----------------------------------------------------------------------
  // Plate (material block) with a hole through the centre
  // -----------------------------------------------------------------------
  function renderPlateWithHole(
    y: number, h: number, holeRadius: number,
    fill: string, stroke: string, label: string,
  ): React.ReactNode {
    return (
      <g>
        {/* Left half */}
        <rect
          x={plateL} y={y}
          width={cx - holeRadius - plateL} height={h}
          fill={fill} stroke={stroke} strokeWidth="1"
        />
        {/* Right half */}
        <rect
          x={cx + holeRadius} y={y}
          width={plateR_ - (cx + holeRadius)} height={h}
          fill={fill} stroke={stroke} strokeWidth="1"
        />
        {/* Label */}
        <text
          x={plateR_ - 6} y={y + h / 2}
          textAnchor="end" dominantBaseline="central"
          fontSize="8" fill="#475569" fontWeight="500"
        >
          {label}
        </text>
      </g>
    );
  }

  // -----------------------------------------------------------------------
  // Plate with tapped (threaded) hole — hole = shank radius, with zigzag
  // -----------------------------------------------------------------------
  function renderTappedPlate(
    y: number, h: number,
    fill: string, stroke: string, label: string,
  ): React.ReactNode {
    return (
      <g>
        {/* Left half */}
        <rect
          x={plateL} y={y}
          width={cx - shankR - plateL} height={h}
          fill={fill} stroke={stroke} strokeWidth="1"
        />
        {/* Right half */}
        <rect
          x={cx + shankR} y={y}
          width={plateR_ - (cx + shankR)} height={h}
          fill={fill} stroke={stroke} strokeWidth="1"
        />
        {/* Base (solid bottom) */}
        <rect
          x={plateL} y={y + h}
          width={plateW} height={12}
          fill={fill} stroke={stroke} strokeWidth="1"
        />
        {/* Thread pattern */}
        {renderThreads(y, y + h)}
        {/* Label */}
        <text
          x={plateR_ - 6} y={y + h / 2}
          textAnchor="end" dominantBaseline="central"
          fontSize="8" fill="#475569" fontWeight="500"
        >
          {label}
        </text>
      </g>
    );
  }

  // -----------------------------------------------------------------------
  // Standoff renderer — hollow cylinder with internal threads
  // -----------------------------------------------------------------------
  function renderStandoff(): React.ReactNode {
    if (assemblyType !== 'standoff' || standH <= 0) return null;
    const wallThickness = Math.max(shankR * 0.8, 6);
    const outerR = shankR + wallThickness;
    // Clamp the outer radius so it does not exceed the plate
    const or_ = Math.min(outerR, plateW / 2);
    return (
      <g>
        {/* Left wall */}
        <rect
          x={cx - or_} y={standoffTop}
          width={or_ - shankR} height={standH}
          fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1"
        />
        {/* Right wall */}
        <rect
          x={cx + shankR} y={standoffTop}
          width={or_ - shankR} height={standH}
          fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1"
        />
        {/* Internal thread pattern */}
        {renderThreads(standoffTop, standoffBot, 0)}
        {/* Double vertical lines to suggest hollow cylinder */}
        <line
          x1={cx - or_} y1={standoffTop} x2={cx - or_} y2={standoffBot}
          stroke="#64748b" strokeWidth="1.5"
        />
        <line
          x1={cx + or_} y1={standoffTop} x2={cx + or_} y2={standoffBot}
          stroke="#64748b" strokeWidth="1.5"
        />
        {/* Label */}
        <text
          x={cx + or_ + 6} y={standoffTop + standH / 2}
          textAnchor="start" dominantBaseline="central"
          fontSize="8" fill="#64748b" fontWeight="500"
        >
          Standoff
        </text>
      </g>
    );
  }

  // -----------------------------------------------------------------------
  // Dimension line helper
  // -----------------------------------------------------------------------
  function DimLine({
    x, y1, y2, label, side,
  }: { x: number; y1: number; y2: number; label: string; side: 'left' | 'right' }) {
    if (Math.abs(y2 - y1) < 2) return null;
    const dir = side === 'left' ? -1 : 1;
    const textX = x + dir * 6;
    const anchor = side === 'left' ? 'end' : 'start';
    const a = 3;
    return (
      <g>
        <line x1={x} y1={y1} x2={x} y2={y2} stroke={DIM_COLOR} strokeWidth="1" />
        <polygon points={`${x},${y1} ${x - a},${y1 + a * 2} ${x + a},${y1 + a * 2}`} fill={DIM_COLOR} />
        <polygon points={`${x},${y2} ${x - a},${y2 - a * 2} ${x + a},${y2 - a * 2}`} fill={DIM_COLOR} />
        <line x1={x - 4} y1={y1} x2={x + 4} y2={y1} stroke={DIM_COLOR} strokeWidth="0.75" />
        <line x1={x - 4} y1={y2} x2={x + 4} y2={y2} stroke={DIM_COLOR} strokeWidth="0.75" />
        <text
          x={textX} y={(y1 + y2) / 2}
          textAnchor={anchor} dominantBaseline="central"
          fontSize="9" fill={DIM_COLOR} fontWeight="600"
        >
          {label}
        </text>
      </g>
    );
  }

  // -----------------------------------------------------------------------
  // Horizontal dimension (for diameters)
  // -----------------------------------------------------------------------
  function HorizDim({
    y, x1, x2, label,
  }: { y: number; x1: number; x2: number; label: string }) {
    const a = 2.5;
    return (
      <g>
        <line x1={x1} y1={y} x2={x2} y2={y} stroke={DIM_COLOR} strokeWidth="1" />
        <polygon points={`${x1},${y} ${x1 + a * 2},${y - a} ${x1 + a * 2},${y + a}`} fill={DIM_COLOR} />
        <polygon points={`${x2},${y} ${x2 - a * 2},${y - a} ${x2 - a * 2},${y + a}`} fill={DIM_COLOR} />
        <text
          x={(x1 + x2) / 2} y={y - 5}
          textAnchor="middle" fontSize="8" fill={DIM_COLOR} fontWeight="600"
        >
          {label}
        </text>
      </g>
    );
  }

  // -----------------------------------------------------------------------
  // Countersunk recess cut-out in clamped part
  // -----------------------------------------------------------------------
  function renderCountersunkRecess(): React.ReactNode {
    if (headStyle !== 'countersunk') return null;
    return (
      <path
        d={`
          M ${cx - holeR} ${clampTop}
          L ${cx - headR} ${clampTop}
          L ${cx - shankR} ${clampTop + headH}
          L ${cx - holeR} ${clampTop + headH}
          Z
          M ${cx + holeR} ${clampTop}
          L ${cx + headR} ${clampTop}
          L ${cx + shankR} ${clampTop + headH}
          L ${cx + holeR} ${clampTop + headH}
          Z
        `}
        fill={clampFill} stroke={clampStroke} strokeWidth="0.5"
      />
    );
  }

  // -----------------------------------------------------------------------
  // Screw shank — extends through all layers
  // -----------------------------------------------------------------------
  function renderShank(): React.ReactNode {
    const shankTop = headStyle === 'countersunk' ? clampTop + headH : clampTop;
    // Shank goes all the way to the bottom of the last threaded section
    let shankBot: number;
    if (assemblyType === 'through-nut') {
      shankBot = nutTop + nutH; // extends past nut
    } else {
      shankBot = tappedBot;
    }
    return (
      <rect
        x={cx - shankR} y={shankTop}
        width={shankR * 2} height={shankBot - shankTop}
        fill={SCREW_FILL} stroke={SCREW_STROKE} strokeWidth="0.5"
      />
    );
  }

  // -----------------------------------------------------------------------
  // Dimension lines
  // -----------------------------------------------------------------------
  function renderDimensions(): React.ReactNode {
    const dimX = plateL - 14;
    const rightDimX = plateR_ + 14;
    const elements: React.ReactNode[] = [];

    // Clamp length
    elements.push(
      <DimLine
        key="dim-clamp"
        x={dimX} y1={clampTop} y2={clampBot}
        label={`${clampLength.toFixed(1)} mm`} side="left"
      />,
    );

    // Engagement length
    elements.push(
      <DimLine
        key="dim-engage"
        x={dimX} y1={tappedTop} y2={tappedBot}
        label={`${engagementLength.toFixed(1)} mm`} side="left"
      />,
    );

    // Standoff length
    if (assemblyType === 'standoff' && standH > 0) {
      elements.push(
        <DimLine
          key="dim-standoff"
          x={dimX} y1={standoffTop} y2={standoffBot}
          label={`${standoffLength.toFixed(1)} mm`} side="left"
        />,
      );
    }

    // Head diameter
    if (headStyle !== 'set') {
      const hDimY = (headWasher ? headWasherTop : headTop) - 10;
      elements.push(
        <HorizDim
          key="dim-head"
          y={hDimY} x1={cx - headR} x2={cx + headR}
          label={`\u00D8${screw!.headDiameter.toFixed(1)}`}
        />,
      );
      // Dashed leaders
      const leaderTop = hDimY - 3;
      elements.push(
        <line key="ld-l" x1={cx - headR} y1={headTop} x2={cx - headR} y2={leaderTop} stroke={DIM_COLOR} strokeWidth="0.5" strokeDasharray="2,2" />,
        <line key="ld-r" x1={cx + headR} y1={headTop} x2={cx + headR} y2={leaderTop} stroke={DIM_COLOR} strokeWidth="0.5" strokeDasharray="2,2" />,
      );
    }

    // Washer OD (head washer)
    if (headWasher) {
      const wDimY = headWasherTop - 2;
      elements.push(
        <HorizDim
          key="dim-hw"
          y={wDimY} x1={cx - hwR} x2={cx + hwR}
          label={`\u00D8${headWasher.outerDiameter.toFixed(1)}`}
        />,
      );
    }

    // Hole diameter (shown inside clamped part)
    elements.push(
      <g key="dim-hole">
        <line
          x1={cx - holeR - 8} y1={clampTop + clampH / 2}
          x2={cx - holeR} y2={clampTop + clampH / 2}
          stroke={DIM_COLOR} strokeWidth="0.5" strokeDasharray="2,2"
        />
        <text
          x={cx - holeR - 10} y={clampTop + clampH / 2}
          textAnchor="end" dominantBaseline="central"
          fontSize="7" fill={DIM_COLOR}
        >
          {'\u00D8'}{screw!.holeDiameter.toFixed(1)}
        </text>
      </g>,
    );

    // Nut washer OD
    if (nutWasher && assemblyType === 'through-nut') {
      elements.push(
        <HorizDim
          key="dim-nw"
          y={nutWasherTop + nwTh + 2}
          x1={cx - nwR} x2={cx + nwR}
          label={`\u00D8${nutWasher.outerDiameter.toFixed(1)}`}
        />,
      );
    }

    return <>{elements}</>;
  }

  // -----------------------------------------------------------------------
  // Legend
  // -----------------------------------------------------------------------
  function renderLegend(): React.ReactNode {
    const items: { label: string; fill: string; stroke: string }[] = [];

    if (clampedMaterial) {
      items.push({ label: clampedMaterial.name, fill: clampFill, stroke: clampStroke });
    }
    if (tappedMaterial) {
      items.push({ label: tappedMaterial.name, fill: tapFill, stroke: tapStroke });
    }
    items.push({ label: `Screw (${screw!.type})`, fill: SCREW_FILL, stroke: SCREW_STROKE });
    if (headWasher) {
      items.push({ label: `Washer (${headWasher.standard})`, fill: WASHER_FILL, stroke: WASHER_STROKE });
    }
    if (nut && assemblyType === 'through-nut') {
      items.push({ label: `Nut (${nut.type})`, fill: NUT_FILL, stroke: NUT_STROKE });
    }

    // Position legend near the bottom of the viewBox
    const bottomElement = assemblyType === 'through-nut'
      ? nutTop + nutH
      : assemblyType === 'standoff'
        ? tappedBot + 12
        : tappedBot + 12;
    const legendY = Math.max(bottomElement + 24, VIEW_H - 16 * items.length - 10);

    return (
      <g>
        {items.map((item, i) => {
          const lx = 10;
          const ly = legendY + i * 16;
          return (
            <g key={item.label}>
              <rect
                x={lx} y={ly}
                width={10} height={10} rx="2"
                fill={item.fill} stroke={item.stroke} strokeWidth="0.75"
              />
              <text
                x={lx + 14} y={ly + 5}
                dominantBaseline="central" fontSize="8"
                fill="#64748b"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  // -----------------------------------------------------------------------
  // Assemble the SVG
  // -----------------------------------------------------------------------
  // Determine the hole radius for the tapped/bottom part depending on assembly type.
  // For through-nut the bottom part also has a through (clearance) hole.
  const bottomHoleR = assemblyType === 'tapped-hole' ? shankR : holeR;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200">
        Assembly Cross-Section
      </h3>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Bolted joint assembly cross-section diagram"
      >
        {/* ---- Clamped part (through-hole) ---- */}
        {renderPlateWithHole(
          clampTop, clampH, holeR,
          clampFill, clampStroke,
          clampedMaterial?.name ?? 'Clamped part',
        )}

        {/* Countersunk recess */}
        {renderCountersunkRecess()}

        {/* ---- Standoff (only for standoff assembly) ---- */}
        {renderStandoff()}

        {/* ---- Bottom / tapped part ---- */}
        {assemblyType === 'tapped-hole' ? (
          // Tapped hole — threads in the part
          renderTappedPlate(
            tappedTop, engageH,
            tapFill, tapStroke,
            tappedMaterial?.name ?? 'Tapped part',
          )
        ) : assemblyType === 'through-nut' ? (
          // Through-bolt — bottom part has through-hole, NO threads
          renderPlateWithHole(
            tappedTop, engageH, holeR,
            tapFill, tapStroke,
            tappedMaterial?.name ?? 'Bottom part',
          )
        ) : (
          // Standoff — bottom part is tapped
          renderTappedPlate(
            tappedTop, engageH,
            tapFill, tapStroke,
            tappedMaterial?.name ?? 'Bottom part',
          )
        )}

        {/* ---- Screw shank ---- */}
        {renderShank()}

        {/* ---- Head washer ---- */}
        {headWasher && headStyle !== 'countersunk' && headStyle !== 'set' && (
          renderWasher(
            bodyStart - hwTh, hwR, hwTh, 'head-washer',
          )
        )}

        {/* ---- Screw head ---- */}
        {renderHead()}

        {/* ---- Nut washer (through-nut only) ---- */}
        {nutWasher && assemblyType === 'through-nut' && (
          renderWasher(
            nutWasherTop, nwR, nwTh, 'nut-washer',
          )
        )}

        {/* ---- Nut ---- */}
        {renderNut()}

        {/* ---- Thread pattern in tapped regions (tapped-hole & standoff bottom) ---- */}
        {/* Already rendered inside renderTappedPlate and renderStandoff */}

        {/* ---- Dimension lines ---- */}
        {renderDimensions()}

        {/* ---- Legend ---- */}
        {renderLegend()}
      </svg>
    </div>
  );
}
