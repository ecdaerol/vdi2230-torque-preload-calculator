import React from 'react';
import { OperatingStateResult } from '../../calc/operatingState';

export function safe(value: number): string {
  if (!isFinite(value) || Number.isNaN(value)) return '—';
  return value.toFixed(1);
}

export function safeN(value: number, decimals: number): string {
  if (!isFinite(value) || Number.isNaN(value)) return '—';
  return value.toFixed(decimals);
}

export function safetyColor(sf: number): string {
  return sf < 1 ? 'var(--danger)' : sf < 1.5 ? 'var(--warn)' : 'var(--ok)';
}

export function StatusBadge({ status }: { status: 'ok' | 'warning' | 'danger' | 'na' }) {
  const styles: Record<string, React.CSSProperties> = {
    ok: { backgroundColor: 'var(--ok-bg)', color: 'var(--ok)' },
    warning: { backgroundColor: 'var(--warn-bg)', color: 'var(--warn)' },
    danger: { backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' },
    na: { backgroundColor: 'var(--na-bg)', color: 'var(--muted)' },
  };
  const labels = { ok: 'OK', warning: 'WARNING', danger: 'DANGER', na: 'N/A' };
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold" style={styles[status]}>
      {labels[status]}
    </span>
  );
}

export function getOperatingStatus(
  axialServiceLoad: number,
  shearServiceLoad: number,
  operatingState: OperatingStateResult | null,
): 'ok' | 'warning' | 'danger' | 'na' {
  if (axialServiceLoad <= 0 && shearServiceLoad <= 0) return 'na';
  if (!operatingState) return 'warning';
  if (operatingState.isSeparated || operatingState.willSlip || operatingState.shearSafetyFactor < 1) return 'danger';
  if (operatingState.separationMargin < 1.5 || operatingState.slipSafetyFactor < 1.5 || operatingState.shearSafetyFactor < 1.5) return 'warning';
  return 'ok';
}

/** Unit conversion factors */
export interface UnitFactors {
  Nto: number;     // Force factor (1 for N, 0.2248 for lbf)
  Nmto: number;    // Torque factor (1 for N·m, 0.7376 for lb·ft)
  forceUnit: string;
  torqueUnit: string;
  pressureUnit: string;
}

export function getUnitFactors(useImperial: boolean): UnitFactors {
  return {
    Nto: useImperial ? 0.2248 : 1,
    Nmto: useImperial ? 0.7376 : 1,
    forceUnit: useImperial ? 'lbf' : 'N',
    torqueUnit: useImperial ? 'lb·ft' : 'N·m',
    pressureUnit: 'MPa',
  };
}
