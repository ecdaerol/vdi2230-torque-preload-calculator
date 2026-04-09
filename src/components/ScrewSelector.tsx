import { useState, useMemo } from 'react';
import { ScrewData, screwDatabase } from '../data/screws';

interface Props {
  value: ScrewData | null;
  onChange: (screw: ScrewData) => void;
}

export default function ScrewSelector({ value, onChange }: Props) {
  // Get unique standards (with type description)
  const standards = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of screwDatabase) {
      if (!seen.has(s.standard)) {
        seen.set(s.standard, s.type);
      }
    }
    return Array.from(seen.entries()).map(([standard, type]) => ({ standard, type }));
  }, []);

  const [selectedStandard, setSelectedStandard] = useState<string>(value?.standard ?? '');

  // Sizes available for the selected standard
  const availableSizes = useMemo(() => {
    if (!selectedStandard) return [];
    return screwDatabase.filter(s => s.standard === selectedStandard);
  }, [selectedStandard]);

  const handleStandardChange = (std: string) => {
    setSelectedStandard(std);
    // Auto-select first size of the new standard
    const first = screwDatabase.find(s => s.standard === std);
    if (first) onChange(first);
  };

  const handleSizeChange = (size: string) => {
    const screw = screwDatabase.find(s => s.standard === selectedStandard && s.size === size);
    if (screw) onChange(screw);
  };

  const selectClass =
    'w-full px-3 py-2 text-sm bg-white border rounded-[10px] focus:outline-none focus:ring-2';
  const selectStyle: React.CSSProperties = { borderColor: 'var(--line)' };

  const formatSizeOption = (s: ScrewData) => {
    const drive = s.driveType === 'Torx' ? s.driveSize : `Hex ${s.driveSize}mm`;
    if (!s.hasHead) return `${s.size} × ${s.pitch} — ${drive}`;
    if (s.shoulderDiameter) return `${s.size} × ${s.pitch} — ${drive} (Ø${s.shoulderDiameter} shoulder)`;
    return `${s.size} × ${s.pitch} — ${drive} (Ø${s.headDiameter} head)`;
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
        onChange={(e) => handleStandardChange(e.target.value)}
      >
        <option value="">Select a standard...</option>
        {standards.map(({ standard, type }) => (
          <option key={standard} value={standard}>
            {standard} — {type}
          </option>
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
            onChange={(e) => handleSizeChange(e.target.value)}
          >
            <option value="">Select a size...</option>
            {availableSizes.map(s => (
              <option key={s.size} value={s.size}>
                {formatSizeOption(s)}
              </option>
            ))}
          </select>
        </div>
      )}

      {value && (
        <div className="mt-2 text-xs grid grid-cols-2 gap-x-4 gap-y-1" style={{ color: 'var(--muted)' }}>
          <span>Pitch: {value.pitch} mm</span>
          <span>Stress area: {value.stressArea} mm²</span>
          <span>Pitch Ø: {value.d2} mm</span>
          <span>Drive: {value.driveType} {value.driveSize}{value.driveType === 'Hex socket' ? ' mm' : ''}</span>
          <span>Minor Ø: {value.d3} mm</span>
          <span>Clearance hole: {value.holeDiameter} mm</span>
          {value.hasHead && <span>Head Ø: {value.headDiameter} mm</span>}
          {value.hasHead && <span>Head height: {value.headHeight} mm</span>}
          {value.shoulderDiameter && <span>Shoulder Ø: {value.shoulderDiameter} mm</span>}
          {value.isCountersunk && <span style={{ color: 'var(--warn)' }}>Countersunk</span>}
          {!value.hasHead && <span style={{ color: 'var(--warn)' }}>Set screw (no head)</span>}
        </div>
      )}
    </div>
  );
}
