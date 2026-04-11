import { AssemblyType } from './AssemblyDiagram';

const assemblyOptions: { value: AssemblyType; label: string }[] = [
  { value: 'tapped-hole', label: 'Tapped Hole' },
  { value: 'through-nut', label: 'Nut & Bolt' },
];

function AssemblyModeIcon({ mode, active }: { mode: AssemblyType; active: boolean }) {
  const common = {
    stroke: 'currentColor',
    strokeWidth: active ? 1.35 : 1.15,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (mode === 'tapped-hole') {
    return (
      <svg width="56" height="56" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="6.2" width="16" height="2.4" rx="1" {...common} />
        <rect x="4" y="11" width="16" height="8.2" rx="1" {...common} />
        <path d="M12 3.6v12.3" {...common} />
        <path d="M9.2 3.6h5.6" {...common} />
        <path d="M10.2 13.2l-1.4.9 1.4.9" {...common} />
        <path d="M13.8 13.2l1.4.9-1.4.9" {...common} />
        <path d="M10.2 15.6l-1.4.9 1.4.9" {...common} />
        <path d="M13.8 15.6l1.4.9-1.4.9" {...common} />
      </svg>
    );
  }

  if (mode === 'through-nut') {
    return (
      <svg width="56" height="56" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="6.2" width="16" height="2.4" rx="1" {...common} />
        <rect x="4" y="11.8" width="16" height="2.4" rx="1" {...common} />
        <path d="M12 3.6v14.7" {...common} />
        <path d="M9.2 3.6h5.6" {...common} />
        <path d="M9.2 18.2h5.6l1.6 1.8-1.6 1.8H9.2L7.6 20z" {...common} />
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
    <div className="grid grid-cols-3 gap-2 mb-4">
      {assemblyOptions.map((option) => {
        const disabled = disableNutAndBolt && option.value !== 'tapped-hole';
        return (
          <button
            key={option.value}
            disabled={disabled}
            className="flex flex-col items-center justify-center gap-3 min-h-[132px] px-4 py-4 rounded-[12px] text-sm font-medium transition-colors border"
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
