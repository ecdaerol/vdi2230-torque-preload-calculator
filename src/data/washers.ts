/**
 * Washer geometry for bearing-area calculations.
 */
export interface WasherData {
  threadSystem: 'metric' | 'inch';
  family: string;
  standard: string;
  type: string;
  size: string;
  sortKey: number;
  innerDiameter: number;
  outerDiameter: number;
  thickness: number;
}

const inch = (value: number): number => parseFloat((value * 25.4).toFixed(3));
const metricSort = (size: string) => parseFloat(size.replace('M', ''));
const inchSort = (size: string) => {
  const map: Record<string, number> = {
    '#4-40': inch(0.112), '#6-32': inch(0.138), '#8-32': inch(0.164), '#10-24': inch(0.190),
    '#4-48': inch(0.112), '#6-40': inch(0.138), '#8-36': inch(0.164), '#10-32': inch(0.190),
    '1/4-20': inch(0.250), '1/4-28': inch(0.250), '5/16-18': inch(0.3125), '5/16-24': inch(0.3125),
    '3/8-16': inch(0.375), '3/8-24': inch(0.375),
  };
  return map[size] ?? 0;
};

function makeWasher(
  threadSystem: 'metric' | 'inch',
  family: string,
  standard: string,
  type: string,
  size: string,
  innerDiameter: number,
  outerDiameter: number,
  thickness: number
): WasherData {
  return {
    threadSystem,
    family,
    standard,
    type,
    size,
    sortKey: threadSystem === 'metric' ? metricSort(size) : inchSort(size),
    innerDiameter,
    outerDiameter,
    thickness,
  };
}

export const washerDatabase: WasherData[] = [
  // ISO 7089 — Plain washer, normal series
  makeWasher('metric', 'Metric standard', 'ISO 7089', 'Normal', 'M1.6', 1.7, 4.0, 0.3),
  makeWasher('metric', 'Metric standard', 'ISO 7089', 'Normal', 'M2', 2.2, 5.0, 0.3),
  makeWasher('metric', 'Metric standard', 'ISO 7089', 'Normal', 'M2.5', 2.7, 6.0, 0.5),
  makeWasher('metric', 'Metric standard', 'ISO 7089', 'Normal', 'M3', 3.2, 7.0, 0.5),
  makeWasher('metric', 'Metric standard', 'ISO 7089', 'Normal', 'M4', 4.3, 9.0, 0.8),
  makeWasher('metric', 'Metric standard', 'ISO 7089', 'Normal', 'M5', 5.3, 10.0, 1.0),
  makeWasher('metric', 'Metric standard', 'ISO 7089', 'Normal', 'M6', 6.4, 12.0, 1.6),
  makeWasher('metric', 'Metric standard', 'ISO 7089', 'Normal', 'M8', 8.4, 16.0, 1.6),
  makeWasher('metric', 'Metric standard', 'ISO 7089', 'Normal', 'M10', 10.5, 20.0, 2.0),
  makeWasher('metric', 'Metric standard', 'ISO 7089', 'Normal', 'M12', 13.0, 24.0, 2.5),

  // ISO 7092 — small series
  makeWasher('metric', 'Metric standard', 'ISO 7092', 'Small', 'M1.6', 1.7, 3.5, 0.3),
  makeWasher('metric', 'Metric standard', 'ISO 7092', 'Small', 'M2', 2.2, 4.5, 0.3),
  makeWasher('metric', 'Metric standard', 'ISO 7092', 'Small', 'M2.5', 2.7, 5.0, 0.5),
  makeWasher('metric', 'Metric standard', 'ISO 7092', 'Small', 'M3', 3.2, 6.0, 0.5),
  makeWasher('metric', 'Metric standard', 'ISO 7092', 'Small', 'M4', 4.3, 8.0, 0.8),
  makeWasher('metric', 'Metric standard', 'ISO 7092', 'Small', 'M5', 5.3, 9.0, 1.0),
  makeWasher('metric', 'Metric standard', 'ISO 7092', 'Small', 'M6', 6.4, 11.0, 1.6),
  makeWasher('metric', 'Metric standard', 'ISO 7092', 'Small', 'M8', 8.4, 15.0, 1.6),
  makeWasher('metric', 'Metric standard', 'ISO 7092', 'Small', 'M10', 10.5, 18.0, 2.0),
  makeWasher('metric', 'Metric standard', 'ISO 7092', 'Small', 'M12', 13.0, 20.0, 2.5),

  // ISO 7093-1 / wide support style
  makeWasher('metric', 'Metric support', 'ISO 7093-1', 'Large', 'M3', 3.2, 9.0, 0.8),
  makeWasher('metric', 'Metric support', 'ISO 7093-1', 'Large', 'M4', 4.3, 12.0, 1.0),
  makeWasher('metric', 'Metric support', 'ISO 7093-1', 'Large', 'M5', 5.3, 15.0, 1.2),
  makeWasher('metric', 'Metric support', 'ISO 7093-1', 'Large', 'M6', 6.4, 18.0, 1.6),
  makeWasher('metric', 'Metric support', 'ISO 7093-1', 'Large', 'M8', 8.4, 24.0, 2.0),
  makeWasher('metric', 'Metric support', 'ISO 7093-1', 'Large', 'M10', 10.5, 30.0, 2.5),
  makeWasher('metric', 'Metric support', 'ISO 7093-1', 'Large', 'M12', 13.0, 37.0, 3.0),

  // Generic support / fender washers for softer materials and prototypes
  makeWasher('metric', 'Metric support', 'Support', 'Extra-wide support', 'M3', 3.2, 10.0, 0.8),
  makeWasher('metric', 'Metric support', 'Support', 'Extra-wide support', 'M4', 4.3, 14.0, 1.0),
  makeWasher('metric', 'Metric support', 'Support', 'Extra-wide support', 'M5', 5.3, 18.0, 1.2),
  makeWasher('metric', 'Metric support', 'Support', 'Extra-wide support', 'M6', 6.4, 22.0, 1.6),
  makeWasher('metric', 'Metric support', 'Support', 'Extra-wide support', 'M8', 8.4, 30.0, 2.0),
  makeWasher('metric', 'Metric support', 'Support', 'Extra-wide support', 'M10', 10.5, 40.0, 2.5),
  makeWasher('metric', 'Metric support', 'Support', 'Extra-wide support', 'M12', 13.0, 50.0, 3.0),

  // ANSI / SAE washers — narrower OD, common machine hardware
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '#4-40', inch(0.125), inch(0.312), inch(0.032)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '#6-32', inch(0.156), inch(0.375), inch(0.032)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '#8-32', inch(0.188), inch(0.438), inch(0.049)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '#10-24', inch(0.219), inch(0.500), inch(0.049)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '#4-48', inch(0.125), inch(0.312), inch(0.032)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '#6-40', inch(0.156), inch(0.375), inch(0.032)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '#8-36', inch(0.188), inch(0.438), inch(0.049)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '#10-32', inch(0.219), inch(0.500), inch(0.049)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '1/4-20', inch(0.281), inch(0.734), inch(0.065)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '1/4-28', inch(0.281), inch(0.734), inch(0.065)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '5/16-18', inch(0.344), inch(0.875), inch(0.065)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '5/16-24', inch(0.344), inch(0.875), inch(0.065)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '3/8-16', inch(0.406), inch(1.000), inch(0.083)),
  makeWasher('inch', 'Inch SAE', 'ANSI SAE', 'Flat washer', '3/8-24', inch(0.406), inch(1.000), inch(0.083)),

  // USS washers — wider support, good for softer joints
  makeWasher('inch', 'Inch USS', 'ANSI USS', 'Wide flat washer', '#10-24', inch(0.250), inch(0.625), inch(0.049)),
  makeWasher('inch', 'Inch USS', 'ANSI USS', 'Wide flat washer', '#10-32', inch(0.250), inch(0.625), inch(0.049)),
  makeWasher('inch', 'Inch USS', 'ANSI USS', 'Wide flat washer', '1/4-20', inch(0.312), inch(1.062), inch(0.065)),
  makeWasher('inch', 'Inch USS', 'ANSI USS', 'Wide flat washer', '1/4-28', inch(0.312), inch(1.062), inch(0.065)),
  makeWasher('inch', 'Inch USS', 'ANSI USS', 'Wide flat washer', '5/16-18', inch(0.375), inch(1.250), inch(0.083)),
  makeWasher('inch', 'Inch USS', 'ANSI USS', 'Wide flat washer', '5/16-24', inch(0.375), inch(1.250), inch(0.083)),
  makeWasher('inch', 'Inch USS', 'ANSI USS', 'Wide flat washer', '3/8-16', inch(0.438), inch(1.250), inch(0.083)),
  makeWasher('inch', 'Inch USS', 'ANSI USS', 'Wide flat washer', '3/8-24', inch(0.438), inch(1.250), inch(0.083)),
].sort((a, b) => {
  if (a.threadSystem !== b.threadSystem) return a.threadSystem.localeCompare(b.threadSystem);
  if (a.family !== b.family) return a.family.localeCompare(b.family);
  if (a.standard !== b.standard) return a.standard.localeCompare(b.standard);
  return a.sortKey - b.sortKey;
});
