/**
 * Metric screw thread geometry per ISO 261 / ISO 724.
 * Head dimensions per ISO 14580, 14581, 14583, 4762, 4026, 7379.
 * Stress areas per ISO 898-1 Table 2.
 * Clearance holes per ISO 273 (medium fit).
 */
export interface ScrewData {
  standard: string;
  type: string;
  size: string;
  d: number;              // nominal diameter mm
  pitch: number;          // mm
  d2: number;             // pitch diameter mm
  d3: number;             // minor diameter mm
  stressArea: number;     // mm²
  headDiameter: number;   // bearing surface OD mm (0 for set screws)
  headHeight: number;     // mm (0 for set screws)
  driveType: string;      // "Torx" | "Hex socket"
  driveSize: string;      // e.g. "T10" or "3" (mm for hex)
  holeDiameter: number;   // clearance hole diameter mm
  hasHead: boolean;       // false for set screws
  isCountersunk: boolean; // true for ISO 14581
  shoulderDiameter?: number; // only for ISO 7379
}

// Standard metric thread data shared across all standards
const threadData: Record<string, { pitch: number; d2: number; d3: number; As: number }> = {
  "M1.6": { pitch: 0.35, d2: 1.373, d3: 1.171, As: 1.27 },
  "M2":   { pitch: 0.4,  d2: 1.740, d3: 1.509, As: 2.07 },
  "M2.5": { pitch: 0.45, d2: 2.208, d3: 1.948, As: 3.39 },
  "M3":   { pitch: 0.5,  d2: 2.675, d3: 2.387, As: 5.03 },
  "M4":   { pitch: 0.7,  d2: 3.545, d3: 3.141, As: 8.78 },
  "M5":   { pitch: 0.8,  d2: 4.480, d3: 4.019, As: 14.2 },
  "M6":   { pitch: 1.0,  d2: 5.350, d3: 4.773, As: 20.1 },
  "M8":   { pitch: 1.25, d2: 7.188, d3: 6.466, As: 36.6 },
  "M10":  { pitch: 1.5,  d2: 9.026, d3: 8.160, As: 58.0 },
  "M12":  { pitch: 1.75, d2: 10.863, d3: 9.853, As: 84.3 },
};

function nominalDiameter(size: string): number {
  return parseFloat(size.replace("M", ""));
}

function makeScrew(
  standard: string,
  type: string,
  size: string,
  headDiameter: number,
  headHeight: number,
  driveType: string,
  driveSize: string,
  holeDiameter: number,
  hasHead: boolean,
  isCountersunk: boolean,
  shoulderDiameter?: number,
): ScrewData {
  const t = threadData[size];
  return {
    standard,
    type,
    size,
    d: nominalDiameter(size),
    pitch: t.pitch,
    d2: t.d2,
    d3: t.d3,
    stressArea: t.As,
    headDiameter,
    headHeight,
    driveType,
    driveSize,
    holeDiameter,
    hasHead,
    isCountersunk,
    ...(shoulderDiameter !== undefined ? { shoulderDiameter } : {}),
  };
}

export const screwDatabase: ScrewData[] = [
  // ──────────────────────────────────────────────────────────────
  // ISO 14580 — Low head cap screw Torx
  // ──────────────────────────────────────────────────────────────
  makeScrew("ISO 14580", "Low head cap screw Torx", "M1.6", 3.2, 1.3, "Torx", "T5",  1.8,  true, false),
  makeScrew("ISO 14580", "Low head cap screw Torx", "M2",   4.0, 1.6, "Torx", "T6",  2.4,  true, false),
  makeScrew("ISO 14580", "Low head cap screw Torx", "M2.5", 5.0, 2.0, "Torx", "T8",  2.9,  true, false),
  makeScrew("ISO 14580", "Low head cap screw Torx", "M3",   5.5, 2.4, "Torx", "T10", 3.4,  true, false),
  makeScrew("ISO 14580", "Low head cap screw Torx", "M4",   7.0, 3.2, "Torx", "T20", 4.5,  true, false),
  makeScrew("ISO 14580", "Low head cap screw Torx", "M5",   8.5, 4.0, "Torx", "T25", 5.5,  true, false),
  makeScrew("ISO 14580", "Low head cap screw Torx", "M6",  10.0, 4.8, "Torx", "T30", 6.6,  true, false),
  makeScrew("ISO 14580", "Low head cap screw Torx", "M8",  13.0, 6.4, "Torx", "T40", 9.0,  true, false),
  makeScrew("ISO 14580", "Low head cap screw Torx", "M10", 16.0, 8.0, "Torx", "T45", 11.0, true, false),
  makeScrew("ISO 14580", "Low head cap screw Torx", "M12", 18.0, 9.6, "Torx", "T50", 13.5, true, false),

  // ──────────────────────────────────────────────────────────────
  // ISO 14581 — Countersunk flat head Torx
  // ──────────────────────────────────────────────────────────────
  makeScrew("ISO 14581", "Countersunk flat head Torx", "M1.6", 3.2,  0.88, "Torx", "T5",  1.8,  true, true),
  makeScrew("ISO 14581", "Countersunk flat head Torx", "M2",   3.8,  1.1,  "Torx", "T6",  2.4,  true, true),
  makeScrew("ISO 14581", "Countersunk flat head Torx", "M2.5", 4.7,  1.5,  "Torx", "T8",  2.9,  true, true),
  makeScrew("ISO 14581", "Countersunk flat head Torx", "M3",   6.0,  1.65, "Torx", "T10", 3.4,  true, true),
  makeScrew("ISO 14581", "Countersunk flat head Torx", "M4",   8.0,  2.2,  "Torx", "T20", 4.5,  true, true),
  makeScrew("ISO 14581", "Countersunk flat head Torx", "M5",  10.0,  2.75, "Torx", "T25", 5.5,  true, true),
  makeScrew("ISO 14581", "Countersunk flat head Torx", "M6",  12.0,  3.3,  "Torx", "T30", 6.6,  true, true),
  makeScrew("ISO 14581", "Countersunk flat head Torx", "M8",  16.0,  4.4,  "Torx", "T40", 9.0,  true, true),
  makeScrew("ISO 14581", "Countersunk flat head Torx", "M10", 20.0,  5.5,  "Torx", "T45", 11.0, true, true),
  makeScrew("ISO 14581", "Countersunk flat head Torx", "M12", 24.0,  6.5,  "Torx", "T50", 13.5, true, true),

  // ──────────────────────────────────────────────────────────────
  // ISO 14583 — Pan head Torx
  // ──────────────────────────────────────────────────────────────
  makeScrew("ISO 14583", "Pan head Torx", "M1.6", 3.2,  1.3, "Torx", "T5",  1.8,  true, false),
  makeScrew("ISO 14583", "Pan head Torx", "M2",   4.0,  1.6, "Torx", "T6",  2.4,  true, false),
  makeScrew("ISO 14583", "Pan head Torx", "M2.5", 5.0,  2.0, "Torx", "T8",  2.9,  true, false),
  makeScrew("ISO 14583", "Pan head Torx", "M3",   5.5,  2.4, "Torx", "T10", 3.4,  true, false),
  makeScrew("ISO 14583", "Pan head Torx", "M4",   7.0,  3.2, "Torx", "T20", 4.5,  true, false),
  makeScrew("ISO 14583", "Pan head Torx", "M5",   8.5,  3.5, "Torx", "T25", 5.5,  true, false),
  makeScrew("ISO 14583", "Pan head Torx", "M6",  10.0,  4.5, "Torx", "T30", 6.6,  true, false),
  makeScrew("ISO 14583", "Pan head Torx", "M8",  13.0,  5.8, "Torx", "T40", 9.0,  true, false),
  makeScrew("ISO 14583", "Pan head Torx", "M10", 16.0,  7.0, "Torx", "T45", 11.0, true, false),
  makeScrew("ISO 14583", "Pan head Torx", "M12", 18.0,  8.5, "Torx", "T50", 13.5, true, false),

  // ──────────────────────────────────────────────────────────────
  // ISO 4762 — Socket head cap screw (hex socket)
  // ──────────────────────────────────────────────────────────────
  makeScrew("ISO 4762", "Socket head cap screw", "M1.6", 3.0,  1.6,  "Hex socket", "1.5",  1.8,  true, false),
  makeScrew("ISO 4762", "Socket head cap screw", "M2",   3.8,  2.0,  "Hex socket", "1.5",  2.4,  true, false),
  makeScrew("ISO 4762", "Socket head cap screw", "M2.5", 4.5,  2.5,  "Hex socket", "2",    2.9,  true, false),
  makeScrew("ISO 4762", "Socket head cap screw", "M3",   5.5,  3.0,  "Hex socket", "2.5",  3.4,  true, false),
  makeScrew("ISO 4762", "Socket head cap screw", "M4",   7.0,  4.0,  "Hex socket", "3",    4.5,  true, false),
  makeScrew("ISO 4762", "Socket head cap screw", "M5",   8.5,  5.0,  "Hex socket", "4",    5.5,  true, false),
  makeScrew("ISO 4762", "Socket head cap screw", "M6",  10.0,  6.0,  "Hex socket", "5",    6.6,  true, false),
  makeScrew("ISO 4762", "Socket head cap screw", "M8",  13.0,  8.0,  "Hex socket", "6",    9.0,  true, false),
  makeScrew("ISO 4762", "Socket head cap screw", "M10", 16.0, 10.0,  "Hex socket", "8",   11.0,  true, false),
  makeScrew("ISO 4762", "Socket head cap screw", "M12", 18.0, 12.0,  "Hex socket", "10",  13.5,  true, false),

  // ──────────────────────────────────────────────────────────────
  // ISO 4026 — Set screw (hex socket, no head)
  // ──────────────────────────────────────────────────────────────
  makeScrew("ISO 4026", "Set screw hex socket", "M1.6", 0, 0, "Hex socket", "0.7", 1.8,  false, false),
  makeScrew("ISO 4026", "Set screw hex socket", "M2",   0, 0, "Hex socket", "0.9", 2.4,  false, false),
  makeScrew("ISO 4026", "Set screw hex socket", "M2.5", 0, 0, "Hex socket", "1.3", 2.9,  false, false),
  makeScrew("ISO 4026", "Set screw hex socket", "M3",   0, 0, "Hex socket", "1.5", 3.4,  false, false),
  makeScrew("ISO 4026", "Set screw hex socket", "M4",   0, 0, "Hex socket", "2",   4.5,  false, false),
  makeScrew("ISO 4026", "Set screw hex socket", "M5",   0, 0, "Hex socket", "2.5", 5.5,  false, false),
  makeScrew("ISO 4026", "Set screw hex socket", "M6",   0, 0, "Hex socket", "3",   6.6,  false, false),
  makeScrew("ISO 4026", "Set screw hex socket", "M8",   0, 0, "Hex socket", "4",   9.0,  false, false),
  makeScrew("ISO 4026", "Set screw hex socket", "M10",  0, 0, "Hex socket", "5",   11.0, false, false),
  makeScrew("ISO 4026", "Set screw hex socket", "M12",  0, 0, "Hex socket", "6",   13.5, false, false),

  // ──────────────────────────────────────────────────────────────
  // ISO 7379 — Shoulder bolt (M4 and up only)
  // ──────────────────────────────────────────────────────────────
  makeScrew("ISO 7379", "Shoulder bolt", "M4",   7.0,  3.5,  "Hex socket", "3",  5.5,  true, false, 5),
  makeScrew("ISO 7379", "Shoulder bolt", "M5",   8.5,  4.5,  "Hex socket", "4",  6.6,  true, false, 6),
  makeScrew("ISO 7379", "Shoulder bolt", "M6",  10.0,  5.5,  "Hex socket", "5",  9.0,  true, false, 8),
  makeScrew("ISO 7379", "Shoulder bolt", "M8",  13.0,  7.0,  "Hex socket", "6",  11.0, true, false, 10),
  makeScrew("ISO 7379", "Shoulder bolt", "M10", 16.0,  9.0,  "Hex socket", "8",  13.5, true, false, 12),
  makeScrew("ISO 7379", "Shoulder bolt", "M12", 18.0, 11.0,  "Hex socket", "10", 17.5, true, false, 16),
];
