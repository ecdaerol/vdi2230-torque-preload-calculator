import { ScrewData, screwDatabase } from '../data/screws';

interface Props {
  value: ScrewData | null;
  onChange: (screw: ScrewData) => void;
}

export default function ScrewSelector({ value, onChange }: Props) {
  const grouped = screwDatabase.reduce((acc, s) => {
    const key = `${s.standard} — ${s.type}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, ScrewData[]>);

  const formatOption = (s: ScrewData) => {
    const drive = s.driveType === 'Torx' ? s.driveSize : `Hex ${s.driveSize}mm`;
    if (!s.hasHead) return `${s.size} × ${s.pitch} — ${drive}`;
    if (s.shoulderDiameter) return `${s.size} × ${s.pitch} — ${drive} (⌀${s.shoulderDiameter} shoulder)`;
    return `${s.size} × ${s.pitch} — ${drive} (⌀${s.headDiameter} head)`;
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
        Screw
      </label>
      <select
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value ? `${value.standard}|${value.size}` : ''}
        onChange={(e) => {
          const [std, size] = e.target.value.split('|');
          const screw = screwDatabase.find(s => s.standard === std && s.size === size);
          if (screw) onChange(screw);
        }}
      >
        <option value="">Select a screw...</option>
        {Object.entries(grouped).map(([group, screws]) => (
          <optgroup key={group} label={group}>
            {screws.map(s => (
              <option key={`${s.standard}|${s.size}`} value={`${s.standard}|${s.size}`}>
                {formatOption(s)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {value && (
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 grid grid-cols-2 gap-x-4 gap-y-1">
          <span>Pitch: {value.pitch} mm</span>
          <span>Stress area: {value.stressArea} mm²</span>
          <span>Pitch ⌀: {value.d2} mm</span>
          <span>Drive: {value.driveType} {value.driveSize}{value.driveType === 'Hex socket' ? ' mm' : ''}</span>
          <span>Minor ⌀: {value.d3} mm</span>
          <span>Clearance hole: {value.holeDiameter} mm</span>
          {value.hasHead && <span>Head ⌀: {value.headDiameter} mm</span>}
          {value.hasHead && <span>Head height: {value.headHeight} mm</span>}
          {value.shoulderDiameter && <span>Shoulder ⌀: {value.shoulderDiameter} mm</span>}
          {value.isCountersunk && <span className="text-amber-600 dark:text-amber-400">Countersunk</span>}
          {!value.hasHead && <span className="text-amber-600 dark:text-amber-400">Set screw (no head)</span>}
        </div>
      )}
    </div>
  );
}
