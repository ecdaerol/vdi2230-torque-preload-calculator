/**
 * Nut geometry used for nut-side bearing pressure and UI selection.
 * Bearing diameter is an effective contact diameter used for simplified
 * pressure and friction calculations.
 */
export interface NutData {
  threadSystem: 'metric' | 'inch';
  family: string;
  standard: string;
  type: string;
  size: string;
  sortKey: number;
  width: number;           // across flats mm
  height: number;          // mm
  bearingDiameter: number; // mm
}

const inch = (value: number): number => parseFloat((value * 25.4).toFixed(3));

function metricSort(size: string): number {
  return parseFloat(size.replace('M', ''));
}

function inchSort(size: string): number {
  const key = size.replace(' UNC', '').replace(' UNF', '');
  const map: Record<string, number> = {
    '#4-40': inch(0.112),
    '#6-32': inch(0.138),
    '#8-32': inch(0.164),
    '#10-24': inch(0.190),
    '#4-48': inch(0.112),
    '#6-40': inch(0.138),
    '#8-36': inch(0.164),
    '#10-32': inch(0.190),
    '1/4-20': inch(0.250),
    '1/4-28': inch(0.250),
    '5/16-18': inch(0.3125),
    '5/16-24': inch(0.3125),
    '3/8-16': inch(0.375),
    '3/8-24': inch(0.375),
  };
  return map[key] ?? 0;
}

function makeNut(
  threadSystem: 'metric' | 'inch',
  family: string,
  standard: string,
  type: string,
  size: string,
  width: number,
  height: number,
  bearingDiameter: number
): NutData {
  return {
    threadSystem,
    family,
    standard,
    type,
    size,
    sortKey: threadSystem === 'metric' ? metricSort(size) : inchSort(size),
    width,
    height,
    bearingDiameter,
  };
}

export const nutDatabase: NutData[] = [
  // ISO 4032 — Hex nut, style 1
  makeNut('metric', 'Standard hex', 'ISO 4032', 'Hex nut', 'M1.6', 3.2, 1.3, 3.2),
  makeNut('metric', 'Standard hex', 'ISO 4032', 'Hex nut', 'M2', 4.0, 1.6, 4.0),
  makeNut('metric', 'Standard hex', 'ISO 4032', 'Hex nut', 'M2.5', 5.0, 2.0, 5.0),
  makeNut('metric', 'Standard hex', 'ISO 4032', 'Hex nut', 'M3', 5.5, 2.4, 5.5),
  makeNut('metric', 'Standard hex', 'ISO 4032', 'Hex nut', 'M4', 7.0, 3.2, 7.0),
  makeNut('metric', 'Standard hex', 'ISO 4032', 'Hex nut', 'M5', 8.0, 4.7, 8.0),
  makeNut('metric', 'Standard hex', 'ISO 4032', 'Hex nut', 'M6', 10.0, 5.2, 10.0),
  makeNut('metric', 'Standard hex', 'ISO 4032', 'Hex nut', 'M8', 13.0, 6.8, 13.0),
  makeNut('metric', 'Standard hex', 'ISO 4032', 'Hex nut', 'M10', 16.0, 8.4, 16.0),
  makeNut('metric', 'Standard hex', 'ISO 4032', 'Hex nut', 'M12', 18.0, 10.8, 18.0),

  // ISO 4035 — Thin hex nut (jam nut)
  makeNut('metric', 'Standard hex', 'ISO 4035', 'Thin hex nut', 'M2', 4.0, 1.2, 4.0),
  makeNut('metric', 'Standard hex', 'ISO 4035', 'Thin hex nut', 'M2.5', 5.0, 1.6, 5.0),
  makeNut('metric', 'Standard hex', 'ISO 4035', 'Thin hex nut', 'M3', 5.5, 1.8, 5.5),
  makeNut('metric', 'Standard hex', 'ISO 4035', 'Thin hex nut', 'M4', 7.0, 2.2, 7.0),
  makeNut('metric', 'Standard hex', 'ISO 4035', 'Thin hex nut', 'M5', 8.0, 2.7, 8.0),
  makeNut('metric', 'Standard hex', 'ISO 4035', 'Thin hex nut', 'M6', 10.0, 3.2, 10.0),
  makeNut('metric', 'Standard hex', 'ISO 4035', 'Thin hex nut', 'M8', 13.0, 4.0, 13.0),
  makeNut('metric', 'Standard hex', 'ISO 4035', 'Thin hex nut', 'M10', 16.0, 5.0, 16.0),
  makeNut('metric', 'Standard hex', 'ISO 4035', 'Thin hex nut', 'M12', 18.0, 6.0, 18.0),

  // ISO 4161 — Hex flange nuts
  makeNut('metric', 'Locking & flange', 'ISO 4161', 'Hex flange nut', 'M5', 8.0, 5.0, 11.8),
  makeNut('metric', 'Locking & flange', 'ISO 4161', 'Hex flange nut', 'M6', 10.0, 6.0, 14.2),
  makeNut('metric', 'Locking & flange', 'ISO 4161', 'Hex flange nut', 'M8', 13.0, 8.0, 17.9),
  makeNut('metric', 'Locking & flange', 'ISO 4161', 'Hex flange nut', 'M10', 15.0, 10.0, 21.8),
  makeNut('metric', 'Locking & flange', 'ISO 4161', 'Hex flange nut', 'M12', 18.0, 12.0, 26.0),

  // ISO 7040 — Prevailing torque lock nuts with non-metallic insert
  makeNut('metric', 'Locking & flange', 'ISO 7040', 'Nylon insert lock nut', 'M3', 5.5, 4.0, 5.5),
  makeNut('metric', 'Locking & flange', 'ISO 7040', 'Nylon insert lock nut', 'M4', 7.0, 5.0, 7.0),
  makeNut('metric', 'Locking & flange', 'ISO 7040', 'Nylon insert lock nut', 'M5', 8.0, 5.0, 8.0),
  makeNut('metric', 'Locking & flange', 'ISO 7040', 'Nylon insert lock nut', 'M6', 10.0, 6.0, 10.0),
  makeNut('metric', 'Locking & flange', 'ISO 7040', 'Nylon insert lock nut', 'M8', 13.0, 8.0, 13.0),
  makeNut('metric', 'Locking & flange', 'ISO 7040', 'Nylon insert lock nut', 'M10', 16.0, 10.0, 16.0),
  makeNut('metric', 'Locking & flange', 'ISO 7040', 'Nylon insert lock nut', 'M12', 18.0, 12.0, 18.0),

  // ASME B18.2.2 — Inch hex nuts for the new socket/hex screw families
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '#4-40', inch(0.250), inch(0.094), inch(0.250)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '#6-32', inch(0.3125), inch(0.109), inch(0.3125)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '#8-32', inch(0.34375), inch(0.125), inch(0.34375)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '#10-24', inch(0.375), inch(0.141), inch(0.375)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '#4-48', inch(0.250), inch(0.094), inch(0.250)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '#6-40', inch(0.3125), inch(0.109), inch(0.3125)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '#8-36', inch(0.34375), inch(0.125), inch(0.34375)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '#10-32', inch(0.375), inch(0.141), inch(0.375)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '1/4-20', inch(0.4375), inch(0.219), inch(0.4375)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '1/4-28', inch(0.4375), inch(0.219), inch(0.4375)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '5/16-18', inch(0.500), inch(0.266), inch(0.500)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '5/16-24', inch(0.500), inch(0.266), inch(0.500)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '3/8-16', inch(0.5625), inch(0.328), inch(0.5625)),
  makeNut('inch', 'Inch hex', 'ASME B18.2.2', 'Hex nut', '3/8-24', inch(0.5625), inch(0.328), inch(0.5625)),
].sort((a, b) => {
  if (a.threadSystem !== b.threadSystem) return a.threadSystem.localeCompare(b.threadSystem);
  if (a.family !== b.family) return a.family.localeCompare(b.family);
  if (a.standard !== b.standard) return a.standard.localeCompare(b.standard);
  return a.sortKey - b.sortKey;
});
