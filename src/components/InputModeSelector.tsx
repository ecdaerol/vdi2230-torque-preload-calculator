interface Props {
  inputMode: 'utilization' | 'torque' | 'preload';
  onModeChange: (mode: 'utilization' | 'torque' | 'preload') => void;
  utilization: number;
  onUtilizationChange: (value: number) => void;
  torqueInput: number;
  onTorqueChange: (value: number) => void;
  preloadInput: number;
  onPreloadChange: (value: number) => void;
  useImperial: boolean;
  snapPercent: (value: number) => number;
}

export default function InputModeSelector({
  inputMode, onModeChange,
  utilization, onUtilizationChange,
  torqueInput, onTorqueChange,
  preloadInput, onPreloadChange,
  useImperial, snapPercent,
}: Props) {
  const inputClass = 'w-full px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 bg-[var(--panel)] border rounded-[10px]';
  const fieldStyle: React.CSSProperties = { borderColor: 'var(--line)' };

  return (
    <>
      <div className="flex rounded-[10px] p-1 mb-4" style={{ backgroundColor: 'var(--line)' }}>
        {(['utilization', 'torque', 'preload'] as const).map((mode) => (
          <button
            key={mode}
            className="flex-1 px-2 py-1.5 rounded-[8px] text-xs font-semibold transition-colors"
            style={
              inputMode === mode
                ? { background: 'var(--panel)', color: 'var(--ink)', boxShadow: '0 1px 3px var(--shadow)' }
                : { color: 'var(--muted)' }
            }
            aria-label={mode === 'utilization' ? 'Set torque as percentage' : mode === 'torque' ? 'Enter torque value' : 'Enter preload value'}
            onClick={() => onModeChange(mode)}
          >
            {mode === 'utilization' ? 'Torque %' : mode === 'torque' ? 'Torque' : 'Preload'}
          </button>
        ))}
      </div>

      {inputMode === 'utilization' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="utilization-value" style={{ color: 'var(--ink)' }}>
            Torque Level [%]
          </label>
          <div className="flex items-center gap-3">
            <input
              id="utilization-range"
              type="range"
              min="0"
              max="100"
              step="5"
              aria-label="Torque utilization percentage"
              className="brand-range flex-1 cursor-pointer"
              value={utilization}
              onChange={(e) => onUtilizationChange(snapPercent(parseInt(e.target.value)))}
            />
            <input
              id="utilization-value"
              type="number"
              min="0"
              max="100"
              step="5"
              className="w-20 px-3 py-2 text-lg font-mono text-center bg-[var(--panel)] border rounded-[10px] focus:outline-none focus:ring-2"
              style={{ borderColor: utilization > 100 ? 'var(--danger)' : 'var(--line)', '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
              value={utilization}
              onChange={(e) => onUtilizationChange(snapPercent(parseFloat(e.target.value) || 0))}
            />
          </div>
        </div>
      )}

      {inputMode === 'torque' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="torque-input" style={{ color: 'var(--ink)' }}>
            Tightening Torque [{useImperial ? 'lb·ft' : 'N·m'}]
          </label>
          <input
            id="torque-input"
            type="number"
            min="0"
            step="0.1"
            className={inputClass}
            style={fieldStyle}
            value={torqueInput || ''}
            onChange={(e) => onTorqueChange(parseFloat(e.target.value) || 0)}
            placeholder={useImperial ? 'e.g. 25 lb·ft' : 'e.g. 30 N·m'}
          />
        </div>
      )}

      {inputMode === 'preload' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="preload-input" style={{ color: 'var(--ink)' }}>
            Target Preload [{useImperial ? 'lbf' : 'N'}]
          </label>
          <input
            id="preload-input"
            type="number"
            min="0"
            step="1"
            className={inputClass}
            style={fieldStyle}
            value={preloadInput || ''}
            onChange={(e) => onPreloadChange(parseFloat(e.target.value) || 0)}
            placeholder={useImperial ? 'e.g. 5000 lbf' : 'e.g. 25000 N'}
          />
        </div>
      )}
    </>
  );
}
