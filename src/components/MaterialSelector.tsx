import { useState } from 'react';
import { MaterialData, materialDatabase } from '../data/materials';

interface Props {
  value: MaterialData | null;
  onChange: (material: MaterialData) => void;
}

export default function MaterialSelector({ value, onChange }: Props) {
  const [isCustom, setIsCustom] = useState(false);
  const [custom, setCustom] = useState<MaterialData>({
    name: 'Custom',
    category: 'custom',
    elasticModulus: 10,
    yieldStrength: 100,
    shearStrength: 60,
    poissonRatio: 0.35,
    notes: 'User-defined',
  });

  const categories: Record<string, MaterialData[]> = {
    'Metals': materialDatabase.filter(m => m.category === 'metal'),
    'Polymers': materialDatabase.filter(m => m.category === 'polymer'),
    'Composites': materialDatabase.filter(m => m.category === 'composite'),
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
        Material
      </label>
      <select
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={isCustom ? '__custom__' : (value?.name ?? '')}
        onChange={(e) => {
          if (e.target.value === '__custom__') {
            setIsCustom(true);
            onChange(custom);
          } else {
            setIsCustom(false);
            const mat = materialDatabase.find(m => m.name === e.target.value);
            if (mat) onChange(mat);
          }
        }}
      >
        <option value="">Select material...</option>
        {Object.entries(categories).map(([cat, mats]) => (
          <optgroup key={cat} label={cat}>
            {mats.map(m => (
              <option key={m.name} value={m.name}>
                {m.name} — E={m.elasticModulus} GPa, σy={m.yieldStrength} MPa
              </option>
            ))}
          </optgroup>
        ))}
        <optgroup label="Other">
          <option value="__custom__">Custom material...</option>
        </optgroup>
      </select>

      {isCustom && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {([
            ['elasticModulus', 'E [GPa]'],
            ['yieldStrength', 'σy [MPa]'],
            ['shearStrength', 'τ [MPa]'],
            ['poissonRatio', 'ν'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-slate-500 dark:text-slate-400">{label}</label>
              <input
                type="number"
                step="any"
                className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm"
                value={custom[key]}
                onChange={(e) => {
                  const updated = { ...custom, [key]: parseFloat(e.target.value) || 0 };
                  setCustom(updated);
                  onChange(updated);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {value && !isCustom && (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {value.notes}
        </div>
      )}
    </div>
  );
}
