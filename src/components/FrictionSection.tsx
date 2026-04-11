import { FrictionPair } from '../data/friction';

interface Props {
  frictionIdx: number;
  onFrictionIdxChange: (index: number) => void;
  friction: FrictionPair;
  onCustomFrictionChange: (friction: FrictionPair | null) => void;
  frictionGroups: [string, { item: FrictionPair; index: number }[]][];
}

export default function FrictionSection({
  frictionIdx, onFrictionIdxChange,
  friction, onCustomFrictionChange, frictionGroups,
}: Props) {
  const selectClass = 'w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-[var(--panel)] border rounded-[10px]';
  const smallInputClass = 'w-full px-2 py-1 text-sm font-mono bg-[var(--panel)] border rounded-[10px]';
  const fieldStyle: React.CSSProperties = { borderColor: 'var(--line)' };

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" htmlFor="interface-condition" style={{ color: 'var(--ink)' }}>Interface Condition</label>
        <select
          id="interface-condition"
          className={selectClass}
          style={fieldStyle}
          value={frictionIdx}
          onChange={(e) => {
            onFrictionIdxChange(parseInt(e.target.value));
            onCustomFrictionChange(null);
          }}
        >
          {frictionGroups.map(([group, entries]) => (
            <optgroup key={group} label={group}>
              {entries.map(({ item, index }) => (
                <option key={`${group}-${index}`} value={index}>{`${item.name} (${item.condition})`}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="mt-2 text-xs space-y-1" style={{ color: 'var(--muted)' }}>
          <div>Thread friction: {friction.muThread.toFixed(2)} · Head / nut friction: {friction.muHead.toFixed(2)} · Preset scatter: ±{Math.round(friction.scatter * 100)}%</div>
          {friction.notes && <div>{friction.notes}</div>}
        </div>
      </div>

      <details className="mb-4 rounded-[10px] border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--panel)' }}>
        <summary className="px-3 py-2 text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
          Advanced friction settings
        </summary>
        <div className="px-3 pb-3 pt-1 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs mb-1" htmlFor="thread-friction" style={{ color: 'var(--muted)' }}>Thread friction</label>
            <input
              id="thread-friction"
              type="number" step="0.01" min="0.01" max="1"
              className={smallInputClass} style={fieldStyle}
              value={friction.muThread}
              onChange={(e) => onCustomFrictionChange({ ...friction, muThread: Math.max(0.01, parseFloat(e.target.value) || 0.01) })}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" htmlFor="head-friction" style={{ color: 'var(--muted)' }}>Head / nut friction</label>
            <input
              id="head-friction"
              type="number" step="0.01" min="0.01" max="1"
              className={smallInputClass} style={fieldStyle}
              value={friction.muHead}
              onChange={(e) => onCustomFrictionChange({ ...friction, muHead: Math.max(0.01, parseFloat(e.target.value) || 0.01) })}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" htmlFor="preset-scatter" style={{ color: 'var(--muted)' }}>Preset scatter</label>
            <input
              id="preset-scatter"
              type="number" step="0.01" min="0" max="1"
              className={smallInputClass} style={fieldStyle}
              value={friction.scatter}
              onChange={(e) => onCustomFrictionChange({ ...friction, scatter: Math.max(0, parseFloat(e.target.value) || 0) })}
            />
          </div>
        </div>
      </details>
    </>
  );
}
