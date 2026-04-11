import { AssemblyType } from './AssemblyDiagram';
import { ReceiverPreset, receiverPresets } from '../data/receivers';

interface Props {
  assemblyType: AssemblyType;
  receiverPresetIdx: number;
  onReceiverChange: (index: number) => void;
  receiverPreset: ReceiverPreset;
  axialLoadInput: number;
  onAxialChange: (value: number) => void;
  shearLoadInput: number;
  onShearChange: (value: number) => void;
  slipFriction: number;
  onSlipChange: (value: number) => void;
  useImperial: boolean;
  interfaceCount: number;
  onInterfaceCountChange: (value: number) => void;
}

export default function OperatingLoadsSection({
  assemblyType, receiverPresetIdx, onReceiverChange, receiverPreset,
  axialLoadInput, onAxialChange, shearLoadInput, onShearChange,
  slipFriction, onSlipChange, useImperial,
  interfaceCount, onInterfaceCountChange,
}: Props) {
  const selectClass = 'w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-[var(--panel)] border rounded-[10px]';
  const inputClass = 'w-full px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 bg-[var(--panel)] border rounded-[10px]';
  const fieldStyle: React.CSSProperties = { borderColor: 'var(--line)' };

  return (
    <details className="mb-4 rounded-[10px] border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }} open>
      <summary className="px-3 py-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
        Receiver & operating loads
      </summary>
      <div className="px-3 pb-3 pt-1 space-y-3">
        {assemblyType !== 'through-nut' && (
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="thread-receiver" style={{ color: 'var(--ink)' }}>Thread receiver</label>
            <select id="thread-receiver" className={selectClass} style={fieldStyle} value={receiverPresetIdx} onChange={(e) => onReceiverChange(parseInt(e.target.value))}>
              {receiverPresets.map((preset, index) => (
                <option key={preset.key} value={index}>{preset.label}</option>
              ))}
            </select>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {receiverPreset.description} · Capacity factor ×{receiverPreset.internalCapacityFactor.toFixed(2)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="axial-load" style={{ color: 'var(--ink)' }}>External axial load [{useImperial ? 'lbf' : 'N'}]</label>
            <input
              id="axial-load"
              type="number" step="1" min="0"
              className={inputClass} style={fieldStyle}
              value={axialLoadInput || ''}
              onChange={(e) => onAxialChange(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder={useImperial ? 'e.g. 250 lbf' : 'e.g. 1200 N'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="shear-load" style={{ color: 'var(--ink)' }}>External shear load [{useImperial ? 'lbf' : 'N'}]</label>
            <input
              id="shear-load"
              type="number" step="1" min="0"
              className={inputClass} style={fieldStyle}
              value={shearLoadInput || ''}
              onChange={(e) => onShearChange(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder={useImperial ? 'e.g. 120 lbf' : 'e.g. 500 N'}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="slip-friction" style={{ color: 'var(--ink)' }}>Slip interface friction μ</label>
          <input
            id="slip-friction"
            type="number" step="0.01" min="0" max="1"
            className={inputClass} style={fieldStyle}
            value={slipFriction}
            onChange={(e) => onSlipChange(Math.max(0, parseFloat(e.target.value) || 0))}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Used for slip resistance under transverse load. This is separate from tightening friction.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="interface-count" style={{ color: 'var(--ink)' }}>Slip interfaces</label>
          <input
            id="interface-count"
            type="number" step="1" min="1" max="10"
            className={inputClass} style={fieldStyle}
            value={interfaceCount}
            onChange={(e) => onInterfaceCountChange(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Number of friction interfaces (1 = single lap, 2 = double lap).
          </p>
        </div>
      </div>
    </details>
  );
}
