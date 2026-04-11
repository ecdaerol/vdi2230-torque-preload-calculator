import { AssemblyType } from './AssemblyDiagram';

const assemblyOptions: { value: AssemblyType; label: string }[] = [
  { value: 'tapped-hole', label: 'Tapped Hole' },
  { value: 'through-nut', label: 'Nut & Bolt' },
];

function AssemblyModeIcon({ mode, active }: { mode: AssemblyType; active: boolean }) {
  const sw = active ? 1.4 : 1.1;
  const col = 'currentColor';

  if (mode === 'tapped-hole') {
    // Cross-section: bolt going into a tapped plate
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" fill="none">
        {/* Top plate (through-hole) */}
        <rect x="6" y="12" width="14" height="14" rx="1.5" stroke={col} strokeWidth={sw} />
        <rect x="28" y="12" width="14" height="14" rx="1.5" stroke={col} strokeWidth={sw} />
        {/* Bottom plate (tapped — solid with threads) */}
        <rect x="6" y="28" width="36" height="10" rx="1.5" stroke={col} strokeWidth={sw} />
        {/* Bolt shank */}
        <rect x="21.5" y="6" width="5" height="30" rx="1" stroke={col} strokeWidth={sw} />
        {/* Bolt head */}
        <rect x="18" y="4" width="12" height="4" rx="1.5" stroke={col} strokeWidth={sw} />
        {/* Thread lines in tapped hole */}
        <line x1="21.5" y1="30" x2="26.5" y2="30" stroke={col} strokeWidth={0.7} opacity={0.5} />
        <line x1="21.5" y1="32.5" x2="26.5" y2="32.5" stroke={col} strokeWidth={0.7} opacity={0.5} />
        <line x1="21.5" y1="35" x2="26.5" y2="35" stroke={col} strokeWidth={0.7} opacity={0.5} />
      </svg>
    );
  }

  if (mode === 'through-nut') {
    // Cross-section: bolt through two plates with nut
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" fill="none">
        {/* Top plate */}
        <rect x="6" y="12" width="14" height="12" rx="1.5" stroke={col} strokeWidth={sw} />
        <rect x="28" y="12" width="14" height="12" rx="1.5" stroke={col} strokeWidth={sw} />
        {/* Bottom plate */}
        <rect x="6" y="26" width="14" height="12" rx="1.5" stroke={col} strokeWidth={sw} />
        <rect x="28" y="26" width="14" height="12" rx="1.5" stroke={col} strokeWidth={sw} />
        {/* Bolt shank */}
        <rect x="21.5" y="6" width="5" height="38" rx="1" stroke={col} strokeWidth={sw} />
        {/* Bolt head */}
        <rect x="18" y="4" width="12" height="4" rx="1.5" stroke={col} strokeWidth={sw} />
        {/* Nut (hex cross-section) */}
        <path d="M17 40 L19 44 L29 44 L31 40 L29 40 L17 40Z" stroke={col} strokeWidth={sw} strokeLinejoin="round" />
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
            <span className="leading-none" aria-hidden="true"><AssemblyModeIcon mode={option.value} active={!disabled && assemblyType === option.value} /></span>
            <span className="text-[13px] font-semibold leading-tight text-center">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
