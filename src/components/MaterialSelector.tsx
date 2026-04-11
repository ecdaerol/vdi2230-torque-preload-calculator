import { useMemo, useState } from 'react';
import { MaterialData, materialDatabase } from '../data/materials';

interface Props {
  value: MaterialData | null;
  onChange: (material: MaterialData) => void;
}

const customMaterialDefaults: MaterialData = {
  name: 'Custom material',
  category: 'custom',
  group: 'Custom',
  elasticModulus: 10,
  yieldStrength: 100,
  compressiveYield: 120,
  shearStrength: 60,
  poissonRatio: 0.35,
  creepRisk: 'medium',
  notes: 'User-defined material data.',
};

export default function MaterialSelector({ value, onChange }: Props) {
  const [isCustom, setIsCustom] = useState(false);
  const [custom, setCustom] = useState<MaterialData>(customMaterialDefaults);

  const groupedMaterials = useMemo(() => {
    const groups = new Map<string, MaterialData[]>();
    for (const material of materialDatabase) {
      const label = `${material.category === 'metal' ? 'Metals' : material.category === 'polymer' ? 'Polymers' : 'Composites'} — ${material.group}`;
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(material);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, []);

  const selectClass = 'w-full px-3 py-2 text-sm bg-[var(--panel)] border rounded-[10px] focus:outline-none focus:ring-2';
  const inputClass = 'w-full px-2 py-1 text-sm font-mono bg-[var(--panel)] border rounded-[10px]';
  const fieldStyle: React.CSSProperties = { borderColor: 'var(--line)' };

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
        Material
      </label>
      <select
        className={selectClass}
        style={fieldStyle}
        value={isCustom ? '__custom__' : (value?.name ?? '')}
        onChange={(event) => {
          if (event.target.value === '__custom__') {
            setIsCustom(true);
            onChange(custom);
            return;
          }
          setIsCustom(false);
          const selected = materialDatabase.find((material) => material.name === event.target.value);
          if (selected) onChange(selected);
        }}
      >
        <option value="">Select material...</option>
        {groupedMaterials.map(([label, materials]) => (
          <optgroup key={label} label={label}>
            {materials.map((material) => (
              <option key={material.name} value={material.name}>
                {material.name} — E={material.elasticModulus} GPa, σy={material.yieldStrength} MPa
              </option>
            ))}
          </optgroup>
        ))}
        <optgroup label="Other">
          <option value="__custom__">Custom material...</option>
        </optgroup>
      </select>

      {isCustom && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Material name</label>
            <input
              type="text"
              className={inputClass}
              style={fieldStyle}
              value={custom.name}
              onChange={(event) => {
                const updated = { ...custom, name: event.target.value || 'Custom material' };
                setCustom(updated);
                onChange(updated);
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['elasticModulus', 'E [GPa]'],
              ['yieldStrength', 'σy tension [MPa]'],
              ['compressiveYield', 'σy comp [MPa]'],
              ['shearStrength', 'τ [MPa]'],
              ['poissonRatio', 'ν'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</label>
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  style={fieldStyle}
                  value={custom[key]}
                  onChange={(event) => {
                    const updated = { ...custom, [key]: parseFloat(event.target.value) || 0 };
                    setCustom(updated);
                    onChange(updated);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {value && !isCustom && (
        <div className="mt-2 text-xs space-y-1" style={{ color: 'var(--muted)' }}>
          <div>{value.notes}</div>
          <div>
            Category: <span className="font-medium">{value.group}</span> · Creep risk: <span className="font-medium">{value.creepRisk}</span>
          </div>
        </div>
      )}
    </div>
  );
}
