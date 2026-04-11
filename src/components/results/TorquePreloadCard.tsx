import { safeN, UnitFactors } from './ResultsUtils';
import { calculateServicePreload } from '../../calc/preloadRealism';

interface Props {
  torque: number;
  torqueMin: number;
  torqueMax: number;
  servicePreload: ReturnType<typeof calculateServicePreload>;
  serviceLossPercent: number;
  units: UnitFactors;
}

export default function TorquePreloadCard({ torque, torqueMin, torqueMax, servicePreload, serviceLossPercent, units }: Props) {
  const { Nto, Nmto, forceUnit, torqueUnit } = units;
  return (
    <div className="card p-5">
      <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Torque & Preload</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Tightening Torque</div>
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--brand)' }}>
            {safeN(torque * Nmto, 3)} <span className="text-sm">{torqueUnit}</span>
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
            Torque for nominal preload: {safeN(torqueMin * Nmto, 3)} – {safeN(torqueMax * Nmto, 3)} {torqueUnit}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Initial Preload</div>
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--brand)' }}>
            {safeN(servicePreload.initial.preloadNominal * Nto, 0)} <span className="text-sm">{forceUnit}</span>
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
            Expected band: {safeN(servicePreload.initial.preloadMin * Nto, 0)} – {safeN(servicePreload.initial.preloadMax * Nto, 0)} {forceUnit}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Service Preload</div>
          <div className="text-2xl font-bold font-mono" style={{ color: serviceLossPercent > 20 ? 'var(--warn)' : 'var(--brand)' }}>
            {safeN(servicePreload.service.preloadNominal * Nto, 0)} <span className="text-sm">{forceUnit}</span>
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
            After losses: {safeN(servicePreload.service.preloadMin * Nto, 0)} – {safeN(servicePreload.service.preloadMax * Nto, 0)} {forceUnit}
          </div>
        </div>
      </div>
    </div>
  );
}
