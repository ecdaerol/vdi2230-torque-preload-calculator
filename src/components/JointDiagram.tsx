import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { calculateJointStiffness } from '../calc/jointStiffness';

interface Props {
  preload: number;
  screw: ScrewData | null;
  material: MaterialData | null;
  clampLength: number;
  clampLengthSplit: number;
  gradeName: string;
  secondMaterial?: MaterialData | null;
}

export default function JointDiagram({ preload, screw, material, clampLength, clampLengthSplit, gradeName, secondMaterial }: Props) {
  if (!screw || !material || preload <= 0 || clampLength <= 0) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Joint Diagram</h3>
        <div className="h-64 flex items-center justify-center" style={{ color: 'var(--muted)' }}>
          Enter valid preload and clamp length to see joint diagram
        </div>
      </div>
    );
  }

  const js = calculateJointStiffness(preload, screw, material, clampLength, gradeName, secondMaterial, clampLengthSplit);
  const points = js.diagramData.map((point) => ({
    deformation: parseFloat((point.deformation * 1000).toFixed(1)), // mm → μm for display
    bolt: point.boltForce,
    clamp: point.clampForce,
  }));

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Joint Plot</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>Bolt force</span>
          <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>Clamp force</span>
          <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>Preload reference</span>
        </div>
      </div>

      {secondMaterial && (
        <div className="mb-3 text-xs" style={{ color: 'var(--muted)' }}>
          Stiffness split: {clampLengthSplit.toFixed(1)} mm top part + {Math.max(0, clampLength - clampLengthSplit).toFixed(1)} mm bottom part
        </div>
      )}

      <div className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
        Deformation [μm] vs force [N]
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={points} margin={{ top: 10, right: 18, left: 18, bottom: 18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
          <XAxis
            dataKey="deformation"
            tick={{ fontSize: 10, fill: 'var(--muted)' }}
            tickMargin={8}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--muted)' }}
            tickMargin={8}
            width={56}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--ink)' }}
            formatter={(value: number, name: string) => [`${value} N`, name === 'bolt' ? 'Bolt force' : 'Clamp force']}
            labelFormatter={(label) => `${label} μm`}
          />
          <ReferenceLine y={preload} stroke="#6366f1" strokeDasharray="5 5" />
          <Line type="monotone" dataKey="bolt" name="Bolt force" stroke="#3b82f6" strokeWidth={2.25} dot={false} />
          <Line type="monotone" dataKey="clamp" name="Clamp force" stroke="#ef4444" strokeWidth={2.25} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
