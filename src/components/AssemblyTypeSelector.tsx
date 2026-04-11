import { AssemblyType } from './AssemblyDiagram';

const assemblyOptions: { value: AssemblyType; label: string }[] = [
  { value: 'tapped-hole', label: 'Tapped Hole' },
  { value: 'through-nut', label: 'Nut & Bolt' },
];

function AssemblyModeIcon({ mode, active }: { mode: AssemblyType; active: boolean }) {
  const sw = active ? 1.5 : 1.15;
  const col = 'currentColor';

  if (mode === 'tapped-hole') {
    // Side-view: hex fastener threading directly into a tapped block
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" fill="none">
        {/* Hex head (side view — flat top/bottom, angled sides) */}
        <path d="M16 8 L18 6 L30 6 L32 8 L32 14 L30 16 L18 16 L16 14 Z" stroke={col} strokeWidth={sw} strokeLinejoin="round" />
        {/* Shank */}
        <rect x="20" y="16" width="8" height="10" stroke={col} strokeWidth={sw} />
        {/* Tapped block */}
        <rect x="8" y="26" width="32" height="16" rx="2" stroke={col} strokeWidth={sw} />
        {/* Thread engagement lines */}
        <line x1="20" y1="29" x2="28" y2="29" stroke={col} strokeWidth={0.75} opacity={0.45} />
        <line x1="20" y1="32" x2="28" y2="32" stroke={col} strokeWidth={0.75} opacity={0.45} />
        <line x1="20" y1="35" x2="28" y2="35" stroke={col} strokeWidth={0.75} opacity={0.45} />
        <line x1="20" y1="38" x2="28" y2="38" stroke={col} strokeWidth={0.75} opacity={0.45} />
      </svg>
    );
  }

  if (mode === 'through-nut') {
    // Side-view: bolt through a plate, nut below
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" fill="none">
        {/* Bolt head (hex side view) */}
        <path d="M16 5 L18 3 L30 3 L32 5 L32 11 L30 13 L18 13 L16 11 Z" stroke={col} strokeWidth={sw} strokeLinejoin="round" />
        {/* Shank through plate */}
        <rect x="20" y="13" width="8" height="27" stroke={col} strokeWidth={sw} />
        {/* Plate (through-hole — two halves) */}
        <rect x="8" y="18" width="12" height="14" rx="1.5" stroke={col} strokeWidth={sw} />
        <rect x="28" y="18" width="12" height="14" rx="1.5" stroke={col} strokeWidth={sw} />
        {/* Nut (hex side view) */}
        <path d="M16 40 L18 38 L30 38 L32 40 L32 44 L30 46 L18 46 L16 44 Z" stroke={col} strokeWidth={sw} strokeLinejoin="round" />
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
