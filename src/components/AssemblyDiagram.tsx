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

  // ---- Stable schematic layout ----
  // Keep the preview representative, but visually stable across size and length changes.
  const clampH = 92;
  const engageH = assemblyType === 'through-nut' ? 44 : 58;
  const standH = assemblyType === 'standoff' ? 42 : 0;

  const shankR = headStyle === 'set' ? 12 : 13;
  const dNom = shankR * 2;
  const holeR = shankR + 2.5;
  const headR = headStyle === 'countersunk'
    ? 50
    : headStyle === 'socket'
      ? 26
      : headStyle === 'shoulder'
        ? 28
        : headStyle === 'set'
          ? 0
          : 24;
  const headH = headStyle === 'countersunk'
    ? 34
    : headStyle === 'pan'
      ? 20
      : headStyle === 'socket' || headStyle === 'shoulder'
        ? 24
        : 0;

  const hwTh = headWasher ? 4 : 0;
  const hwR = headWasher ? 34 : 0;

  const nwTh = nutWasher ? 4 : 0;
  const nwR = nutWasher ? 34 : 0;

  const nutH = nut ? 16 : 0;
  const nutR = nut ? 30 : 0;

  // Plate width — wide enough to contain everything
  const plateW = 200;
  const plateL = cx - plateW / 2;
  const plateR_ = cx + plateW / 2;

  // ---- Vertical layout (top to bottom) ----
  // Head sits above the body stack. For countersunk the head recesses into the clamped part.
  const topOffset = 44;
  const bodyStart = headStyle === 'countersunk'
    ? topOffset
    : topOffset + headH + (headWasher ? hwTh : 0);

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
    fill: string, stroke: string, _label: string,
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
      </g>
    );
  }

  function renderCountersunkClamp(
    y: number, h: number,
    fill: string, stroke: string,
  ): React.ReactNode {
    const gap = 1.6;
    const recessTopY = y + gap;
    const recessBottom = Math.min(y + headH - gap, y + h);
    const topRadius = Math.max(headR + gap, holeR + gap + 1);
    const bottomRadius = shankR + gap;

    return (
      <g>
        <path
          d={`
            M ${plateL} ${y}
            L ${cx - topRadius} ${y}
            L ${cx - bottomRadius} ${recessBottom}
            L ${cx - holeR} ${recessBottom}
            L ${cx - holeR} ${y + h}
            L ${plateL} ${y + h}
            Z
          `}
          fill={fill}
          stroke={stroke}
          strokeWidth="1"
        />
        <path
          d={`
            M ${plateR_} ${y}
            L ${cx + topRadius} ${y}
            L ${cx + bottomRadius} ${recessBottom}
            L ${cx + holeR} ${recessBottom}
            L ${cx + holeR} ${y + h}
            L ${plateR_} ${y + h}
            Z
          `}
          fill={fill}
          stroke={stroke}
          strokeWidth="1"
        />

        <line
          x1={cx - topRadius}
          y1={recessTopY}
          x2={cx - bottomRadius}
          y2={recessBottom}
          stroke={stroke}
          strokeWidth="0.75"
          strokeOpacity="0.45"
        />
        <line
          x1={cx + topRadius}
          y1={recessTopY}
          x2={cx + bottomRadius}
          y2={recessBottom}
          stroke={stroke}
          strokeWidth="0.75"
          strokeOpacity="0.45"
        />
      </g>
    );
  }

  // -----------------------------------------------------------------------
  // Plate with tapped (threaded) hole — hole = shank radius, with zigzag
  // -----------------------------------------------------------------------
  function renderTappedPlate(
    y: number, h: number,
    fill: string, stroke: string, _label: string,
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
      </g>
    );
  }

  // -----------------------------------------------------------------------
  // Standoff renderer — male/female hex electronics standoff
  // -----------------------------------------------------------------------
  function renderStandoff(): React.ReactNode {
    if (assemblyType !== 'standoff' || standH <= 0) return null;
    const bodyHalf = 28;
    const chamfer = 5;
    const femaleBot = standoffTop + standH * 0.58;
    const cavityR = shankR + 2.5;

    return (
      <g>
        <path
          d={`
            M ${cx - bodyHalf + chamfer} ${standoffTop}
            L ${cx + bodyHalf - chamfer} ${standoffTop}
            L ${cx + bodyHalf} ${standoffTop + chamfer}
            L ${cx + bodyHalf} ${standoffBot - chamfer}
            L ${cx + bodyHalf - chamfer} ${standoffBot}
            L ${cx - bodyHalf + chamfer} ${standoffBot}
            L ${cx - bodyHalf} ${standoffBot - chamfer}
            L ${cx - bodyHalf} ${standoffTop + chamfer}
            Z
          `}
          fill="#e2e8f0"
          stroke="#94a3b8"
          strokeWidth="1"
        />

        <rect
          x={cx - cavityR}
          y={standoffTop + 1}
          width={cavityR * 2}
          height={femaleBot - standoffTop - 1}
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="0.6"
          rx="0.5"
        />

        {renderThreads(standoffTop + 3, femaleBot - 1, 0)}
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
  // Screw shank — stable schematic by assembly type
  // -----------------------------------------------------------------------
  function renderShank(): React.ReactNode {
    const shankTop = headStyle === 'countersunk' ? clampTop + headH : clampTop;
    let shankBot: number;

    if (assemblyType === 'through-nut') {
      shankBot = nutTop + nutH;
    } else if (assemblyType === 'standoff') {
      shankBot = standoffTop + standH * 0.58;
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

  function renderStandoffStud(): React.ReactNode {
    if (assemblyType !== 'standoff' || standH <= 0) return null;
    const studTop = standoffBot;
    const studBot = tappedTop + engageH * 0.72;

    return (
      <g>
        <rect
          x={cx - shankR} y={studTop}
          width={shankR * 2} height={studBot - studTop}
          fill={SCREW_FILL} stroke={SCREW_STROKE} strokeWidth="0.5"
        />
        {renderThreads(studTop + 2, studBot - 1, 0)}
      </g>
    );
  }

  // -----------------------------------------------------------------------
  // Dimension lines
  // -----------------------------------------------------------------------
  function renderDimensions(): React.ReactNode {
    const dimX = plateL - 14;
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

    return <>{elements}</>;
  }

  const infoItems: { label: string; value: string; fill: string; stroke: string }[] = [];
  if (clampedMaterial) {
    infoItems.push({ label: 'Top part', value: clampedMaterial.name, fill: clampFill, stroke: clampStroke });
  }
  if (tappedMaterial) {
    infoItems.push({
      label: assemblyType === 'through-nut' ? 'Bottom part' : 'Threaded part',
      value: tappedMaterial.name,
      fill: tapFill,
      stroke: tapStroke,
    });
  }
  infoItems.push({ label: 'Screw', value: `${screw!.size} — ${screw!.type}`, fill: SCREW_FILL, stroke: SCREW_STROKE });
  if (headWasher) {
    infoItems.push({ label: 'Head washer', value: headWasher.standard, fill: WASHER_FILL, stroke: WASHER_STROKE });
  }
  if (nutWasher && assemblyType === 'through-nut') {
    infoItems.push({ label: 'Nut washer', value: nutWasher.standard, fill: WASHER_FILL, stroke: WASHER_STROKE });
  }
  if (nut && assemblyType === 'through-nut') {
    infoItems.push({ label: 'Nut', value: nut.type, fill: NUT_FILL, stroke: NUT_STROKE });
  }
  if (assemblyType === 'standoff' && standH > 0) {
    infoItems.push({ label: 'Hex standoff', value: 'Male / female electronics standoff', fill: '#e2e8f0', stroke: '#94a3b8' });
  }

  const contentBottom = assemblyType === 'through-nut'
    ? nutTop + nutH
    : tappedBot + 12;
  const svgHeight = Math.max(contentBottom + 24, 250);

  // -----------------------------------------------------------------------
  // Assemble the SVG
  // -----------------------------------------------------------------------
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Assembly View
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: 'var(--muted)', backgroundColor: '#f3f4f6' }}>
          {assemblyType === 'tapped-hole' ? 'Tapped hole' : assemblyType === 'through-nut' ? 'Nut & bolt' : 'Hex standoff'}
        </span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] items-start">
        <div className="rounded-[12px] border overflow-hidden" style={{ borderColor: 'var(--line)', backgroundColor: '#fafafa' }}>
          {infoItems.map((item, index) => (
            <div
              key={`${item.label}-${item.value}`}
              className="flex items-start gap-3 px-4 py-3"
              style={{ borderTop: index === 0 ? 'none' : '1px solid var(--line)' }}
            >
              <span className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: item.fill, border: `1px solid ${item.stroke}` }} />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{item.label}</div>
                <div className="text-sm leading-snug" style={{ color: 'var(--ink)' }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto flex justify-center">
          <svg
            viewBox={`0 0 ${VIEW_W} ${svgHeight}`}
            className="w-full max-w-[560px] h-auto"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Bolted joint assembly cross-section diagram"
          >
        {/* ---- Clamped part ---- */}
        {headStyle === 'countersunk'
          ? renderCountersunkClamp(
              clampTop,
              clampH,
              clampFill,
              clampStroke,
            )
          : renderPlateWithHole(
              clampTop,
              clampH,
              holeR,
              clampFill,
              clampStroke,
              clampedMaterial?.name ?? 'Clamped part',
            )}

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
        {renderStandoffStud()}

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
          </svg>
        </div>
      </div>
    </div>
  );
}
