import { useEffect, useMemo, useState } from 'react';
import { ScrewData, screwDatabase } from '../data/screws';

interface Props {
  value: ScrewData | null;
  onChange: (screw: ScrewData) => void;
}

interface StandardGroup {
  label: string;
  standards: { standard: string; type: string }[];
}

function formatPitch(screw: ScrewData): string {
  if (screw.threadSystem === 'inch') {
    const tpi = 25.4 / screw.pitch;
    return `${Math.round(tpi)} TPI`;
  }
  return `${screw.pitch.toFixed(screw.pitch < 1 ? 2 : 1)} mm`;
}

function formatDrive(screw: ScrewData): string {
  return `${screw.driveType} ${screw.driveSize}`;
}

export default function ScrewSelector({ value, onChange }: Props) {
  const standardGroups = useMemo<StandardGroup[]>(() => {
    const groups = new Map<string, Map<string, string>>();
    for (const screw of screwDatabase) {
      const label = `${screw.threadSystem === 'metric' ? 'Metric' : 'Inch'} — ${screw.family}`;
      if (!groups.has(label)) groups.set(label, new Map());
      const group = groups.get(label)!;
      if (!group.has(screw.standard)) group.set(screw.standard, screw.type);
    }

    return Array.from(groups.entries())
      .map(([label, standards]) => ({
        label,
        standards: Array.from(standards.entries()).map(([standard, type]) => ({ standard, type })),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const [selectedStandard, setSelectedStandard] = useState<string>(value?.standard ?? '');

  useEffect(() => {
    if (value?.standard && value.standard !== selectedStandard) {
      setSelectedStandard(value.standard);
    }
  }, [selectedStandard, value?.standard]);

  const availableSizes = useMemo(() => {
    if (!selectedStandard) return [];
    return screwDatabase
      .filter((screw) => screw.standard === selectedStandard)
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [selectedStandard]);

  const handleStandardChange = (standard: string) => {
    setSelectedStandard(standard);
    const first = screwDatabase
      .filter((screw) => screw.standard === standard)
      .sort((a, b) => a.sortKey - b.sortKey)[0];
    if (first) onChange(first);
  };

  const handleSizeChange = (size: string) => {
    const screw = screwDatabase.find((entry) => entry.standard === selectedStandard && entry.size === size);
    if (screw) onChange(screw);
  };

  const selectClass = 'w-full px-3 py-2 text-sm bg-[var(--panel)] border rounded-[10px] focus:outline-none focus:ring-2';
  const selectStyle: React.CSSProperties = { borderColor: 'var(--line)' };

  const formatSizeOption = (screw: ScrewData): string => {
    if (!screw.hasHead) return `${screw.size} — ${formatPitch(screw)} · ${formatDrive(screw)}`;
    if (screw.shoulderDiameter) return `${screw.size} — ${formatPitch(screw)} · ${formatDrive(screw)} · Ø${screw.shoulderDiameter.toFixed(1)} shoulder`;
    return `${screw.size} — ${formatPitch(screw)} · ${formatDrive(screw)} · Ø${screw.headDiameter.toFixed(1)} head`;
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
        Screw Standard
      </label>
      <select
        className={selectClass}
        style={selectStyle}
        value={selectedStandard}
        onChange={(event) => handleStandardChange(event.target.value)}
      >
        <option value="">Select a standard...</option>
        {standardGroups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.standards.map(({ standard, type }) => (
              <option key={standard} value={standard}>
                {standard} — {type}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {selectedStandard && (
        <div className="mt-3">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
            Screw Size
          </label>
          <select
            className={selectClass}
            style={selectStyle}
            value={value?.standard === selectedStandard ? value.size : ''}
            onChange={(event) => handleSizeChange(event.target.value)}
          >
            <option value="">Select a size...</option>
            {availableSizes.map((screw) => (
              <option key={`${screw.standard}-${screw.size}`} value={screw.size}>
                {formatSizeOption(screw)}
              </option>
            ))}
          </select>
        </div>
      )}

      {value && (
        <div className="mt-2 text-xs grid grid-cols-2 gap-x-4 gap-y-1" style={{ color: 'var(--muted)' }}>
          <span>Thread system: {value.threadSystem === 'metric' ? 'Metric' : 'Inch'}</span>
          <span>Series: {value.threadSeries}</span>
          <span>Pitch: {formatPitch(value)}</span>
          <span>Stress area: {value.stressArea.toFixed(value.stressArea < 10 ? 2 : 1)} mm²</span>
          <span>Pitch Ø: {value.d2.toFixed(3)} mm</span>
          <span>Drive: {formatDrive(value)}</span>
          <span>Minor Ø: {value.d3.toFixed(3)} mm</span>
          <span>Clearance hole: {value.holeDiameter.toFixed(2)} mm</span>
          {value.hasHead && <span>Head Ø: {value.headDiameter.toFixed(2)} mm</span>}
          {value.hasHead && <span>Head height: {value.headHeight.toFixed(2)} mm</span>}
          {value.partiallyThreaded && <span style={{ color: 'var(--warn)' }}>Partially threaded</span>}
          {value.shoulderDiameter && <span>Shoulder Ø: {value.shoulderDiameter.toFixed(2)} mm</span>}
          {value.isCountersunk && <span style={{ color: 'var(--warn)' }}>Countersunk</span>}
          {!value.hasHead && <span style={{ color: 'var(--warn)' }}>Set screw (no head)</span>}
        </div>
      )}
    </div>
  );
}
