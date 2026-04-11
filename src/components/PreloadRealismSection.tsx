import { TighteningMethod, tighteningMethods } from '../calc/preloadRealism';

interface Props {
  tighteningMethodIdx: number;
  onMethodChange: (index: number) => void;
  tighteningMethod: TighteningMethod;
  relaxationLossPct: number;
  onRelaxationChange: (value: number) => void;
  settlementMicrons: number;
  onSettlementChange: (value: number) => void;
}

export default function PreloadRealismSection({
  tighteningMethodIdx, onMethodChange, tighteningMethod,
  relaxationLossPct, onRelaxationChange,
  settlementMicrons, onSettlementChange,
}: Props) {
  const selectClass = 'w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-[var(--panel)] border rounded-[10px]';
  const inputClass = 'w-full px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 bg-[var(--panel)] border rounded-[10px]';
  const fieldStyle: React.CSSProperties = { borderColor: 'var(--line)' };

  return (
    <details className="mb-4 rounded-[10px] border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }} open>
      <summary className="px-3 py-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
        Preload realism
      </summary>
      <div className="px-3 pb-3 pt-1 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="tightening-method" style={{ color: 'var(--ink)' }}>Tightening method</label>
          <select id="tightening-method" className={selectClass} style={fieldStyle} value={tighteningMethodIdx} onChange={(e) => onMethodChange(parseInt(e.target.value))}>
            {tighteningMethods.map((method, index) => (
              <option key={method.key} value={index}>{method.label}</option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Added process scatter: ±{Math.round(tighteningMethod.processScatter * 100)}% · {tighteningMethod.notes}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="relaxation-loss" style={{ color: 'var(--ink)' }}>Relaxation loss [%]</label>
            <input
              id="relaxation-loss"
              type="number" step="1" min="0" max="100"
              className={inputClass} style={fieldStyle}
              value={relaxationLossPct}
              onChange={(e) => onRelaxationChange(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="settlement" style={{ color: 'var(--ink)' }}>Settlement / embedding [μm]</label>
            <input
              id="settlement"
              type="number" step="1" min="0"
              className={inputClass} style={fieldStyle}
              value={settlementMicrons}
              onChange={(e) => onSettlementChange(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Use these to estimate service preload after settling, creep, or early-life preload loss.
        </p>
      </div>
    </details>
  );
}
