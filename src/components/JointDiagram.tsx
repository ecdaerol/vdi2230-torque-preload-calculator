import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { calculateJointStiffness } from '../calc/jointStiffness';

interface Props {
  preload: number;
  screw: ScrewData | null;
  material: MaterialData | null;
  secondMaterial?: MaterialData | null;
  clampLength: number;
  gradeName: string;
}

export default function JointDiagram({ preload, screw, material, secondMaterial, clampLength, gradeName }: Props) {
  if (!screw || !material || !preload) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Joint Diagram</h3>
        <div className="h-64 flex items-center justify-center" style={{ color: 'var(--muted)' }}>
          Enter values to see joint diagram
        </div>
      </div>
    );
  }

  const js = calculateJointStiffness(preload, screw, material, clampLength, gradeName, secondMaterial ?? undefined);

  // Build diagram data: bolt extension and clamp compression
  const preloadDeformation = preload / js.boltStiffness;
  const maxDef = preloadDeformation * 2;
  const points = [];

  for (let i = 0; i <= 40; i++) {
    const def = (i / 40) * maxDef;
    const boltForce = js.boltStiffness * def;
    const clampRelief = js.clampStiffness * Math.max(0, def - preloadDeformation);
    const clampForce = Math.max(0, preload - clampRelief);
    points.push({
      deformation: parseFloat((def * 1000).toFixed(1)),
      bolt: Math.round(boltForce),
      clamp: Math.round(clampForce),
    });
  }

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Joint Diagram (VDI 2230)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={points} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
          <XAxis
            dataKey="deformation"
            label={{ value: 'Deformation [μm]', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            label={{ value: 'Force [N]', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11 } }}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, backgroundColor: 'rgba(15,23,42,0.9)', border: 'none', borderRadius: 8, color: '#e2e8f0' }}
            formatter={(value: number, name: string) => [`${value} N`, name === 'bolt' ? 'Bolt Force' : 'Clamp Force']}
            labelFormatter={(label) => `${label} μm`}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={preload} stroke="#6366f1" strokeDasharray="5 5" label={{ value: `F_V = ${preload.toFixed(0)} N`, position: 'right', style: { fontSize: 10, fill: '#6366f1' } }} />
          <Line type="monotone" dataKey="bolt" name="Bolt Force" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="clamp" name="Clamp Force" stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
