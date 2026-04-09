import React from 'react';
import type { ScrewData } from '../data/screws';
import type { MaterialData } from '../data/materials';

interface Props {
  screw: ScrewData | null;
  clampedMaterial: MaterialData | null;
  tappedMaterial: MaterialData | null;
  clampLength: number;
  engagementLength: number;
}

function getMaterialColor(material: MaterialData | null): string {
  if (!material) return '#cbd5e1';
  switch (material.category) {
    case 'metal': return '#93c5fd';
    case 'polymer': return '#86efac';
    case 'composite': return '#c4b5fd';
    default: return '#cbd5e1';
  }
}

function getMaterialColorDark(material: MaterialData | null): string {
  if (!material) return '#475569';
  switch (material.category) {
    case 'metal': return '#3b82f6';
    case 'polymer': return '#22c55e';
    case 'composite': return '#8b5cf6';
    default: return '#475569';
  }
}

type ScrewType = 'pan' | 'countersunk' | 'socket' | 'set' | 'shoulder';

function classifyScrew(screw: ScrewData): ScrewType {
  const std = screw.standard.toLowerCase();
  const type = screw.type.toLowerCase();
  if (std.includes('4026') || type.includes('set screw') || type.includes('grub')) return 'set';
  if (std.includes('7379') || type.includes('shoulder')) return 'shoulder';
  if (std.includes('4762') || type.includes('socket head') || type.includes('cap screw')) return 'socket';
  if (std.includes('14581') || type.includes('countersunk') || type.includes('flat head')) return 'countersunk';
  return 'pan';
}

const SCREW_COLOR = '#94a3b8';
const SCREW_COLOR_DARK = '#64748b';
const DIM_COLOR = '#f97316';
const DIM_COLOR_DARK = '#fb923c';

export default function AssemblyDiagram({
  screw,
  clampedMaterial,
  tappedMaterial,
  clampLength,
  engagementLength,
}: Props) {
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

  const screwType = classifyScrew(screw);

  // --- Layout constants ---
  const cx = 150; // center x
  const viewW = 300;
  const viewH = 400;

  // Scale real mm dimensions into SVG space. We pick a scale so that
  // a typical M6 assembly (~20mm total) fills most of the diagram height.
  const totalReal = clampLength + engagementLength || 1;
  const maxBodyH = 240;
  const scale = Math.min(maxBodyH / totalReal, 18);

  const clampH = Math.max(clampLength * scale, 20);
  const engageH = Math.max(engagementLength * scale, 20);

  // Screw geometry (scaled)
  const dNom = screw.d * scale;
  const headDia = screw.headDiameter * scale;
  const headH = screw.headHeight * scale;
  const holeDia = screw.holeDiameter * scale;
  const shankR = dNom / 2;
  const holeR = holeDia / 2;
  const headR = headDia / 2;

  // Vertical positions
  const partTop = screwType === 'countersunk' ? 80 : 80 + headH;
  const clampTop = partTop;
  const clampBot = clampTop + clampH;
  const tappedTop = clampBot + 2; // small gap between parts
  const tappedBot = tappedTop + engageH;

  // Plate width
  const plateW = 200;
  const plateL = cx - plateW / 2;
  const plateR = cx + plateW / 2;

  // Head top
  const headTop = screwType === 'countersunk' ? clampTop - headH * 0.15 : clampTop - headH;

  const clampColor = getMaterialColor(clampedMaterial);
  const clampColorDark = getMaterialColorDark(clampedMaterial);
  const tappedColor = getMaterialColor(tappedMaterial);
  const tappedColorDark = getMaterialColorDark(tappedMaterial);

  // --- Thread zigzag pattern ---
  const threadLines: React.ReactNode[] = [];
  const threadPitch = Math.max(dNom * 0.35, 4);
  const threadCount = Math.floor(engageH / threadPitch);
  for (let i = 0; i < threadCount; i++) {
    const y = tappedTop + i * threadPitch + threadPitch * 0.5;
    if (y + threadPitch * 0.5 > tappedBot) break;
    threadLines.push(
      <polyline
        key={`thread-l-${i}`}
        points={`${cx - shankR},${y} ${cx - shankR - 4},${y + threadPitch * 0.25} ${cx - shankR},${y + threadPitch * 0.5}`}
        className="stroke-slate-400 dark:stroke-slate-500"
        strokeWidth="1"
        fill="none"
      />,
      <polyline
        key={`thread-r-${i}`}
        points={`${cx + shankR},${y} ${cx + shankR + 4},${y + threadPitch * 0.25} ${cx + shankR},${y + threadPitch * 0.5}`}
        className="stroke-slate-400 dark:stroke-slate-500"
        strokeWidth="1"
        fill="none"
      />,
    );
  }

  // --- Screw head ---
  function renderHead(): React.ReactNode {
    switch (screwType) {
      case 'pan': {
        // Rounded dome
        const domeH = headH * 0.35;
        return (
          <path
            d={`
              M ${cx - headR} ${clampTop}
              L ${cx - headR} ${headTop + domeH}
              Q ${cx - headR} ${headTop}, ${cx} ${headTop}
              Q ${cx + headR} ${headTop}, ${cx + headR} ${headTop + domeH}
              L ${cx + headR} ${clampTop}
              Z
            `}
            fill={SCREW_COLOR}
            className="dark:fill-slate-500"
            stroke="#64748b"
            strokeWidth="1"
          />
        );
      }
      case 'countersunk': {
        // Cone sunk into clamped part — head top is flush with clamped surface
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
            fill={SCREW_COLOR}
            className="dark:fill-slate-500"
            stroke="#64748b"
            strokeWidth="1"
          />
        );
      }
      case 'socket': {
        // Tall cylindrical head
        return (
          <rect
            x={cx - headR}
            y={headTop}
            width={headR * 2}
            height={headH}
            fill={SCREW_COLOR}
            className="dark:fill-slate-500"
            stroke="#64748b"
            strokeWidth="1"
            rx="1"
          />
        );
      }
      case 'set': {
        // No head — nothing to render
        return null;
      }
      case 'shoulder': {
        // Cylindrical head + wider shoulder
        const shoulderR = shankR + 4;
        const shoulderH = clampH * 0.3;
        return (
          <>
            {/* Head */}
            <rect
              x={cx - headR}
              y={headTop}
              width={headR * 2}
              height={headH}
              fill={SCREW_COLOR}
              className="dark:fill-slate-500"
              stroke="#64748b"
              strokeWidth="1"
              rx="1"
            />
            {/* Shoulder section */}
            <rect
              x={cx - shoulderR}
              y={clampTop}
              width={shoulderR * 2}
              height={shoulderH}
              fill={SCREW_COLOR}
              className="dark:fill-slate-500"
              stroke="#64748b"
              strokeWidth="0.5"
            />
          </>
        );
      }
    }
  }

  // --- Dimension arrow helper ---
  function DimensionLine({
    x, y1, y2, label, side,
  }: { x: number; y1: number; y2: number; label: string; side: 'left' | 'right' }) {
    const dir = side === 'left' ? -1 : 1;
    const textX = x + dir * 6;
    const textAnchor = side === 'left' ? 'end' : 'start';
    const arrowSize = 3;
    return (
      <g className="text-orange-500 dark:text-orange-400">
        {/* Vertical line */}
        <line
          x1={x} y1={y1} x2={x} y2={y2}
          stroke={DIM_COLOR}
          className="dark:stroke-orange-400"
          strokeWidth="1"
        />
        {/* Top arrow */}
        <polygon
          points={`${x},${y1} ${x - arrowSize},${y1 + arrowSize * 2} ${x + arrowSize},${y1 + arrowSize * 2}`}
          fill={DIM_COLOR}
          className="dark:fill-orange-400"
        />
        {/* Bottom arrow */}
        <polygon
          points={`${x},${y2} ${x - arrowSize},${y2 - arrowSize * 2} ${x + arrowSize},${y2 - arrowSize * 2}`}
          fill={DIM_COLOR}
          className="dark:fill-orange-400"
        />
        {/* Tick lines */}
        <line x1={x - 4} y1={y1} x2={x + 4} y2={y1} stroke={DIM_COLOR} className="dark:stroke-orange-400" strokeWidth="0.75" />
        <line x1={x - 4} y1={y2} x2={x + 4} y2={y2} stroke={DIM_COLOR} className="dark:stroke-orange-400" strokeWidth="0.75" />
        {/* Label */}
        <text
          x={textX}
          y={(y1 + y2) / 2}
          textAnchor={textAnchor}
          dominantBaseline="central"
          fontSize="9"
          fill={DIM_COLOR}
          className="dark:fill-orange-400"
          fontWeight="600"
        >
          {label}
        </text>
      </g>
    );
  }

  // --- Head diameter dimension ---
  function HeadDiaDimension() {
    if (screwType === 'set') return null;
    const y = headTop - 8;
    const arrowSize = 2.5;
    const x1 = cx - headR;
    const x2 = cx + headR;
    return (
      <g>
        <line x1={x1} y1={y} x2={x2} y2={y} stroke={DIM_COLOR} className="dark:stroke-orange-400" strokeWidth="1" />
        {/* Left arrow */}
        <polygon
          points={`${x1},${y} ${x1 + arrowSize * 2},${y - arrowSize} ${x1 + arrowSize * 2},${y + arrowSize}`}
          fill={DIM_COLOR} className="dark:fill-orange-400"
        />
        {/* Right arrow */}
        <polygon
          points={`${x2},${y} ${x2 - arrowSize * 2},${y - arrowSize} ${x2 - arrowSize * 2},${y + arrowSize}`}
          fill={DIM_COLOR} className="dark:fill-orange-400"
        />
        {/* Dashed leaders */}
        <line x1={x1} y1={headTop} x2={x1} y2={y - 2} stroke={DIM_COLOR} className="dark:stroke-orange-400" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1={x2} y1={headTop} x2={x2} y2={y - 2} stroke={DIM_COLOR} className="dark:stroke-orange-400" strokeWidth="0.5" strokeDasharray="2,2" />
        <text
          x={cx}
          y={y - 4}
          textAnchor="middle"
          fontSize="8"
          fill={DIM_COLOR}
          className="dark:fill-orange-400"
          fontWeight="600"
        >
          {'\u00D8'}{screw!.headDiameter.toFixed(1)}
        </text>
      </g>
    );
  }

  // Hole diameter dimension
  function HoleDiaDimension() {
    const y = clampTop + clampH / 2;
    const x1 = cx - holeR;
    const x2 = cx + holeR;
    return (
      <g>
        <line x1={x1 - 6} y1={y} x2={x1} y2={y} stroke={DIM_COLOR} className="dark:stroke-orange-400" strokeWidth="0.5" strokeDasharray="2,2" />
        <text
          x={x1 - 8}
          y={y}
          textAnchor="end"
          dominantBaseline="central"
          fontSize="7"
          fill={DIM_COLOR}
          className="dark:fill-orange-400"
        >
          {'\u00D8'}{screw!.holeDiameter.toFixed(1)}
        </text>
      </g>
    );
  }

  // Legend items
  const legendItems: { label: string; color: string; darkColor: string }[] = [];
  if (clampedMaterial) {
    legendItems.push({ label: clampedMaterial.name, color: clampColor, darkColor: clampColorDark });
  }
  if (tappedMaterial) {
    legendItems.push({ label: tappedMaterial.name, color: tappedColor, darkColor: tappedColorDark });
  }
  legendItems.push({ label: `Screw (${screw.type})`, color: SCREW_COLOR, darkColor: SCREW_COLOR_DARK });

  const legendY = Math.max(tappedBot + 30, viewH - 55);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200">
        Assembly Cross-Section
      </h3>
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Bolted joint assembly cross-section diagram"
      >
        {/* --- Clamped part (top plate with through-hole) --- */}
        <g>
          {/* Left half */}
          <rect
            x={plateL}
            y={clampTop}
            width={cx - holeR - plateL}
            height={clampH}
            fill={clampColor}
            className="dark:fill-blue-500/50"
            stroke="#64748b"
            strokeWidth="1"
          />
          {/* Right half */}
          <rect
            x={cx + holeR}
            y={clampTop}
            width={plateR - (cx + holeR)}
            height={clampH}
            fill={clampColor}
            className="dark:fill-blue-500/50"
            stroke="#64748b"
            strokeWidth="1"
          />
          {/* Top bridge */}
          {screwType !== 'countersunk' && (
            <rect
              x={cx - holeR}
              y={clampTop}
              width={holeR * 2}
              height={0}
              fill={clampColor}
            />
          )}
          {/* Countersunk recess */}
          {screwType === 'countersunk' && (
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
              fill={clampColor}
              className="dark:fill-blue-500/50"
              stroke="#64748b"
              strokeWidth="0.5"
            />
          )}
          {/* Material label */}
          <text
            x={plateR - 4}
            y={clampTop + clampH / 2}
            textAnchor="end"
            dominantBaseline="central"
            fontSize="8"
            className="fill-slate-600 dark:fill-slate-300"
            fontWeight="500"
          >
            {clampedMaterial?.name ?? 'Clamped part'}
          </text>
        </g>

        {/* --- Tapped part (bottom block with threads) --- */}
        <g>
          {/* Left half */}
          <rect
            x={plateL}
            y={tappedTop}
            width={cx - shankR - plateL}
            height={engageH}
            fill={tappedColor}
            className="dark:fill-green-500/50"
            stroke="#64748b"
            strokeWidth="1"
          />
          {/* Right half */}
          <rect
            x={cx + shankR}
            y={tappedTop}
            width={plateR - (cx + shankR)}
            height={engageH}
            fill={tappedColor}
            className="dark:fill-green-500/50"
            stroke="#64748b"
            strokeWidth="1"
          />
          {/* Extend tapped block below threads */}
          <rect
            x={plateL}
            y={tappedBot}
            width={plateW}
            height={20}
            fill={tappedColor}
            className="dark:fill-green-500/50"
            stroke="#64748b"
            strokeWidth="1"
          />
          {/* Thread zigzag */}
          {threadLines}
          {/* Material label */}
          <text
            x={plateR - 4}
            y={tappedTop + engageH / 2}
            textAnchor="end"
            dominantBaseline="central"
            fontSize="8"
            className="fill-slate-600 dark:fill-slate-300"
            fontWeight="500"
          >
            {tappedMaterial?.name ?? 'Tapped part'}
          </text>
        </g>

        {/* --- Screw shank in clamped part --- */}
        <rect
          x={cx - shankR}
          y={screwType === 'countersunk' ? clampTop + headH : clampTop}
          width={shankR * 2}
          height={screwType === 'countersunk' ? clampH - headH : clampH}
          fill={SCREW_COLOR}
          className="dark:fill-slate-500"
          stroke="#64748b"
          strokeWidth="0.5"
        />

        {/* --- Screw shank in tapped part --- */}
        <rect
          x={cx - shankR}
          y={tappedTop}
          width={shankR * 2}
          height={engageH}
          fill={SCREW_COLOR}
          className="dark:fill-slate-500"
          stroke="#64748b"
          strokeWidth="0.5"
        />

        {/* --- Screw head --- */}
        {renderHead()}

        {/* --- Dimension lines --- */}
        {/* Clamp length — left side */}
        <DimensionLine
          x={plateL - 12}
          y1={clampTop}
          y2={clampBot}
          label={`${clampLength.toFixed(1)} mm`}
          side="left"
        />

        {/* Engagement length — left side */}
        <DimensionLine
          x={plateL - 12}
          y1={tappedTop}
          y2={tappedTop + engageH}
          label={`${engagementLength.toFixed(1)} mm`}
          side="left"
        />

        {/* Head diameter — top */}
        <HeadDiaDimension />

        {/* Hole diameter */}
        <HoleDiaDimension />

        {/* --- Legend --- */}
        <g>
          {legendItems.map((item, i) => {
            const lx = 10;
            const ly = legendY + i * 16;
            return (
              <g key={item.label}>
                <rect
                  x={lx}
                  y={ly}
                  width={10}
                  height={10}
                  rx="2"
                  fill={item.color}
                  stroke="#64748b"
                  strokeWidth="0.5"
                />
                <text
                  x={lx + 14}
                  y={ly + 5}
                  dominantBaseline="central"
                  fontSize="8"
                  className="fill-slate-600 dark:fill-slate-300"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
