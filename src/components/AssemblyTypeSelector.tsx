import { AssemblyType } from '../domain/types';

const assemblyOptions: { value: AssemblyType; label: string }[] = [
  { value: 'tapped-hole', label: 'Tapped Hole' },
  { value: 'through-nut', label: 'Nut & Bolt' },
];

function AssemblyModeIcon({ mode }: { mode: AssemblyType }) {
  // Minimal engineering cross-section silhouettes, 24×24 viewBox
  const col = 'currentColor';

  if (mode === 'tapped-hole') {
    return (
      <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={col} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Bolt head */}
        <rect x="8" y="2" width="8" height="3" rx="0.8" />
        {/* Shank */}
        <line x1="10" y1="5" x2="10" y2="14" />
        <line x1="14" y1="5" x2="14" y2="14" />
        {/* Tapped block */}
        <rect x="4" y="10" width="16" height="12" rx="1" />
        {/* Thread marks inside block */}
        <line x1="10.5" y1="13" x2="13.5" y2="13" strokeWidth="0.8" opacity="0.5" />
        <line x1="10.5" y1="15.5" x2="13.5" y2="15.5" strokeWidth="0.8" opacity="0.5" />
        <line x1="10.5" y1="18" x2="13.5" y2="18" strokeWidth="0.8" opacity="0.5" />
      </svg>
    );
  }

  if (mode === 'through-nut') {
    return (
      <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={col} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Bolt head */}
        <rect x="8" y="1" width="8" height="3" rx="0.8" />
        {/* Shank */}
        <line x1="10" y1="4" x2="10" y2="19" />
        <line x1="14" y1="4" x2="14" y2="19" />
        {/* Plate — left half */}
        <rect x="4" y="8" width="6" height="8" rx="0.8" />
        {/* Plate — right half */}
        <rect x="14" y="8" width="6" height="8" rx="0.8" />
        {/* Nut */}
        <rect x="7.5" y="19" width="9" height="3.5" rx="0.8" />
      </svg>
    );
  }
}

interface Props {
  assemblyType: AssemblyType;
  onChange: (type: AssemblyType) => void;
  disableNutAndBolt: boolean;
}

export default function AssemblyTypeSelector({ assemblyType, onChange, disableNutAndBolt }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {assemblyOptions.map((option) => {
        const disabled = disableNutAndBolt && option.value !== 'tapped-hole';
        return (
          <button
            key={option.value}
            disabled={disabled}
            className="flex flex-col items-center justify-center gap-2 min-h-[110px] px-4 py-3 rounded-[12px] text-sm font-medium transition-colors border"
            style={
              disabled
                ? { color: '#9ca3af', borderColor: 'var(--line)', backgroundColor: 'var(--panel)', cursor: 'not-allowed', opacity: 0.65 }
                : assemblyType === option.value
                  ? { background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: '#ffffff', boxShadow: '0 1px 3px var(--shadow)', borderColor: 'transparent' }
                  : { color: 'var(--ink)', borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }
            }
            aria-label={`${option.label} assembly`}
            onClick={() => !disabled && onChange(option.value)}
          >
            <span className="leading-none" aria-hidden="true"><AssemblyModeIcon mode={option.value} /></span>
            <span className="text-[13px] font-semibold leading-tight text-center">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
