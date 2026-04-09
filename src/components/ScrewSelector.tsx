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
        <option value="">Select a Torx screw...</option>
        {Object.entries(grouped).map(([group, screws]) => (
          <optgroup key={group} label={group}>
            {screws.map(s => (
              <option key={`${s.standard}|${s.size}`} value={`${s.standard}|${s.size}`}>
                {s.size} × {s.pitch} — {s.torxSize} (⌀{s.headDiameter} head)
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
          <span>Head ⌀: {value.headDiameter} mm</span>
          <span>Minor ⌀: {value.d3} mm</span>
          <span>Clearance hole: {value.holeDiameter} mm</span>
        </div>
      )}
    </div>
  );
}
