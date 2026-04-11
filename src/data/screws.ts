/**
 * Fastener geometry used by the calculator.
 *
 * Metric thread geometry is based on ISO 261 / ISO 724 / ISO 898-1.
 * Inch thread geometry uses standard UN 60° profile approximations and
 * tensile-stress-area formulas commonly used for UNC / UNF selection.
 *
 * All dimensions are stored internally in millimetres.
 */
export interface ScrewData {
  threadSystem: 'metric' | 'inch';
  threadSeries: string;
  family: string;
  standard: string;
  type: string;
  size: string;
  sortKey: number;
  d: number;              // nominal diameter mm
  pitch: number;          // thread pitch mm
  d2: number;             // pitch diameter mm
  d3: number;             // minor diameter mm
  stressArea: number;     // tensile stress area mm²
  headDiameter: number;   // effective bearing diameter mm (0 for set screws)
  headHeight: number;     // mm
  driveType: string;
  driveSize: string;
  holeDiameter: number;   // typical clearance hole mm
  hasHead: boolean;
  isCountersunk: boolean;
  shoulderDiameter?: number;
  partiallyThreaded?: boolean;
}

interface ThreadGeometry {
  size: string;
  threadSystem: 'metric' | 'inch';
  threadSeries: string;
  sortKey: number;
  d: number;
  pitch: number;
  d2: number;
  d3: number;
  stressArea: number;
  holeDiameter: number;
}

const inch = (value: number): number => parseFloat((value * 25.4).toFixed(3));

const metricThreadData: Record<string, ThreadGeometry> = {
  'M1.6': { size: 'M1.6', threadSystem: 'metric', threadSeries: 'Metric coarse', sortKey: 1.6, d: 1.6, pitch: 0.35, d2: 1.373, d3: 1.171, stressArea: 1.27, holeDiameter: 1.8 },
  'M2':   { size: 'M2',   threadSystem: 'metric', threadSeries: 'Metric coarse', sortKey: 2.0, d: 2.0, pitch: 0.40, d2: 1.740, d3: 1.509, stressArea: 2.07, holeDiameter: 2.4 },
  'M2.5': { size: 'M2.5', threadSystem: 'metric', threadSeries: 'Metric coarse', sortKey: 2.5, d: 2.5, pitch: 0.45, d2: 2.208, d3: 1.948, stressArea: 3.39, holeDiameter: 2.9 },
  'M3':   { size: 'M3',   threadSystem: 'metric', threadSeries: 'Metric coarse', sortKey: 3.0, d: 3.0, pitch: 0.50, d2: 2.675, d3: 2.387, stressArea: 5.03, holeDiameter: 3.4 },
  'M4':   { size: 'M4',   threadSystem: 'metric', threadSeries: 'Metric coarse', sortKey: 4.0, d: 4.0, pitch: 0.70, d2: 3.545, d3: 3.141, stressArea: 8.78, holeDiameter: 4.5 },
  'M5':   { size: 'M5',   threadSystem: 'metric', threadSeries: 'Metric coarse', sortKey: 5.0, d: 5.0, pitch: 0.80, d2: 4.480, d3: 4.019, stressArea: 14.2, holeDiameter: 5.5 },
  'M6':   { size: 'M6',   threadSystem: 'metric', threadSeries: 'Metric coarse', sortKey: 6.0, d: 6.0, pitch: 1.00, d2: 5.350, d3: 4.773, stressArea: 20.1, holeDiameter: 6.6 },
  'M8':   { size: 'M8',   threadSystem: 'metric', threadSeries: 'Metric coarse', sortKey: 8.0, d: 8.0, pitch: 1.25, d2: 7.188, d3: 6.466, stressArea: 36.6, holeDiameter: 9.0 },
  'M10':  { size: 'M10',  threadSystem: 'metric', threadSeries: 'Metric coarse', sortKey: 10.0, d: 10.0, pitch: 1.50, d2: 9.026, d3: 8.160, stressArea: 58.0, holeDiameter: 11.0 },
  'M12':  { size: 'M12',  threadSystem: 'metric', threadSeries: 'Metric coarse', sortKey: 12.0, d: 12.0, pitch: 1.75, d2: 10.863, d3: 9.853, stressArea: 84.3, holeDiameter: 13.5 },
};

function makeUnifiedThread(
  size: string,
  nominalInches: number,
  tpi: number,
  clearanceInches: number,
  threadSeries: 'UNC' | 'UNF'
): ThreadGeometry {
  const pitch = inch(1 / tpi);
  const d = inch(nominalInches);
  const d2 = parseFloat((d - 0.64952 * pitch).toFixed(3));
  const d3 = parseFloat((d - 1.22687 * pitch).toFixed(3));
  const stressAreaIn2 = (Math.PI / 4) * Math.pow(nominalInches - 0.9743 / tpi, 2);
  return {
    size,
    threadSystem: 'inch',
    threadSeries,
    sortKey: d,
    d,
    pitch,
    d2,
    d3,
    stressArea: parseFloat((stressAreaIn2 * 645.16).toFixed(3)),
    holeDiameter: inch(nominalInches + clearanceInches),
  };
}

const inchThreadData: Record<string, ThreadGeometry> = {
  '#4-40 UNC': makeUnifiedThread('#4-40', 0.112, 40, 0.010, 'UNC'),
  '#6-32 UNC': makeUnifiedThread('#6-32', 0.138, 32, 0.011, 'UNC'),
  '#8-32 UNC': makeUnifiedThread('#8-32', 0.164, 32, 0.013, 'UNC'),
  '#10-24 UNC': makeUnifiedThread('#10-24', 0.190, 24, 0.016, 'UNC'),
  '1/4-20 UNC': makeUnifiedThread('1/4-20', 0.250, 20, 0.016, 'UNC'),
  '5/16-18 UNC': makeUnifiedThread('5/16-18', 0.3125, 18, 0.020, 'UNC'),
  '3/8-16 UNC': makeUnifiedThread('3/8-16', 0.375, 16, 0.024, 'UNC'),
  '#4-48 UNF': makeUnifiedThread('#4-48', 0.112, 48, 0.010, 'UNF'),
  '#6-40 UNF': makeUnifiedThread('#6-40', 0.138, 40, 0.011, 'UNF'),
  '#8-36 UNF': makeUnifiedThread('#8-36', 0.164, 36, 0.013, 'UNF'),
  '#10-32 UNF': makeUnifiedThread('#10-32', 0.190, 32, 0.016, 'UNF'),
  '1/4-28 UNF': makeUnifiedThread('1/4-28', 0.250, 28, 0.016, 'UNF'),
  '5/16-24 UNF': makeUnifiedThread('5/16-24', 0.3125, 24, 0.020, 'UNF'),
  '3/8-24 UNF': makeUnifiedThread('3/8-24', 0.375, 24, 0.024, 'UNF'),
};

const threadData: Record<string, ThreadGeometry> = {
  ...metricThreadData,
  ...inchThreadData,
};

function makeScrew(
  thread: ThreadGeometry,
  family: string,
  standard: string,
  type: string,
  headDiameter: number,
  headHeight: number,
  driveType: string,
  driveSize: string,
  hasHead: boolean,
  isCountersunk: boolean,
  options?: { shoulderDiameter?: number; partiallyThreaded?: boolean }
): ScrewData {
  return {
    threadSystem: thread.threadSystem,
    threadSeries: thread.threadSeries,
    family,
    standard,
    type,
    size: thread.size,
    sortKey: thread.sortKey,
    d: thread.d,
    pitch: thread.pitch,
    d2: thread.d2,
    d3: thread.d3,
    stressArea: thread.stressArea,
    headDiameter,
    headHeight,
    driveType,
    driveSize,
    holeDiameter: thread.holeDiameter,
    hasHead,
    isCountersunk,
    ...(options?.shoulderDiameter !== undefined ? { shoulderDiameter: options.shoulderDiameter } : {}),
    ...(options?.partiallyThreaded ? { partiallyThreaded: true } : {}),
  };
}

const metricTorxSizes = ['M1.6', 'M2', 'M2.5', 'M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12'] as const;
const metricMainSizes = ['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12'] as const;
const shoulderSizes = ['M4', 'M5', 'M6', 'M8', 'M10', 'M12'] as const;

const iso14580Head: Record<string, [number, number, string]> = {
  'M1.6': [3.2, 1.3, 'T5'],
  'M2': [4.0, 1.6, 'T6'],
  'M2.5': [5.0, 2.0, 'T8'],
  'M3': [5.5, 2.4, 'T10'],
  'M4': [7.0, 3.2, 'T20'],
  'M5': [8.5, 4.0, 'T25'],
  'M6': [10.0, 4.8, 'T30'],
  'M8': [13.0, 6.4, 'T40'],
  'M10': [16.0, 8.0, 'T45'],
  'M12': [18.0, 9.6, 'T50'],
};

const iso14581Head: Record<string, [number, number, string]> = {
  'M1.6': [3.2, 0.88, 'T5'],
  'M2': [3.8, 1.1, 'T6'],
  'M2.5': [4.7, 1.5, 'T8'],
  'M3': [6.0, 1.65, 'T10'],
  'M4': [8.0, 2.2, 'T20'],
  'M5': [10.0, 2.75, 'T25'],
  'M6': [12.0, 3.3, 'T30'],
  'M8': [16.0, 4.4, 'T40'],
  'M10': [20.0, 5.5, 'T45'],
  'M12': [24.0, 6.5, 'T50'],
};

const iso14583Head: Record<string, [number, number, string]> = {
  'M1.6': [3.2, 1.3, 'T5'],
  'M2': [4.0, 1.6, 'T6'],
  'M2.5': [5.0, 2.0, 'T8'],
  'M3': [5.5, 2.4, 'T10'],
  'M4': [7.0, 3.2, 'T20'],
  'M5': [8.5, 3.5, 'T25'],
  'M6': [10.0, 4.5, 'T30'],
  'M8': [13.0, 5.8, 'T40'],
  'M10': [16.0, 7.0, 'T45'],
  'M12': [18.0, 8.5, 'T50'],
};

const iso4762Head: Record<string, [number, number, string]> = {
  'M1.6': [3.0, 1.6, '1.5'],
  'M2': [3.8, 2.0, '1.5'],
  'M2.5': [4.5, 2.5, '2'],
  'M3': [5.5, 3.0, '2.5'],
  'M4': [7.0, 4.0, '3'],
  'M5': [8.5, 5.0, '4'],
  'M6': [10.0, 6.0, '5'],
  'M8': [13.0, 8.0, '6'],
  'M10': [16.0, 10.0, '8'],
  'M12': [18.0, 12.0, '10'],
};

const iso4026Drive: Record<string, string> = {
  'M1.6': '0.7',
  'M2': '0.9',
  'M2.5': '1.3',
  'M3': '1.5',
  'M4': '2',
  'M5': '2.5',
  'M6': '3',
  'M8': '4',
  'M10': '5',
  'M12': '6',
};

const iso7379Head: Record<string, [number, number, string, number]> = {
  'M4': [7.0, 3.5, '3', 5],
  'M5': [8.5, 4.5, '4', 6],
  'M6': [10.0, 5.5, '5', 8],
  'M8': [13.0, 7.0, '6', 10],
  'M10': [16.0, 9.0, '8', 12],
  'M12': [18.0, 11.0, '10', 16],
};

const iso4017Head: Record<string, [number, number]> = {
  'M3': [5.5, 2.0],
  'M4': [7.0, 2.8],
  'M5': [8.0, 3.5],
  'M6': [10.0, 4.0],
  'M8': [13.0, 5.3],
  'M10': [16.0, 6.4],
  'M12': [18.0, 7.5],
};

const iso7380Head: Record<string, [number, number, string]> = {
  'M3': [5.7, 1.65, '2'],
  'M4': [7.6, 2.2, '2.5'],
  'M5': [9.5, 2.75, '3'],
  'M6': [10.5, 3.3, '4'],
  'M8': [14.0, 4.4, '5'],
  'M10': [17.5, 5.5, '6'],
  'M12': [21.0, 6.6, '8'],
};

const inchSocketSizes = [
  '#4-40 UNC', '#6-32 UNC', '#8-32 UNC', '#10-24 UNC', '1/4-20 UNC', '5/16-18 UNC', '3/8-16 UNC',
  '#4-48 UNF', '#6-40 UNF', '#8-36 UNF', '#10-32 UNF', '1/4-28 UNF', '5/16-24 UNF', '3/8-24 UNF',
] as const;

const inchSocketHead: Record<string, [number, number, string]> = {
  '#4-40 UNC': [inch(0.183), inch(0.112), '3/32'],
  '#6-32 UNC': [inch(0.226), inch(0.138), '7/64'],
  '#8-32 UNC': [inch(0.270), inch(0.164), '9/64'],
  '#10-24 UNC': [inch(0.312), inch(0.190), '5/32'],
  '1/4-20 UNC': [inch(0.375), inch(0.250), '3/16'],
  '5/16-18 UNC': [inch(0.469), inch(0.312), '1/4'],
  '3/8-16 UNC': [inch(0.562), inch(0.375), '5/16'],
  '#4-48 UNF': [inch(0.183), inch(0.112), '3/32'],
  '#6-40 UNF': [inch(0.226), inch(0.138), '7/64'],
  '#8-36 UNF': [inch(0.270), inch(0.164), '9/64'],
  '#10-32 UNF': [inch(0.312), inch(0.190), '5/32'],
  '1/4-28 UNF': [inch(0.375), inch(0.250), '3/16'],
  '5/16-24 UNF': [inch(0.469), inch(0.312), '1/4'],
  '3/8-24 UNF': [inch(0.562), inch(0.375), '5/16'],
};

const inchHexSizes = ['#10-24 UNC', '1/4-20 UNC', '5/16-18 UNC', '3/8-16 UNC', '#10-32 UNF', '1/4-28 UNF', '5/16-24 UNF', '3/8-24 UNF'] as const;

// ---------------------------------------------------------------------------
// Hex standoff F/M — male end acts as screw, hex body is the bearing head
// ---------------------------------------------------------------------------
const standoffMetricSizes = ['M2', 'M2.5', 'M3', 'M4', 'M5'] as const;
const standoffMetricHead: Record<string, [number, number]> = {
  'M2':   [3.2,  1.6],
  'M2.5': [5.0,  2.0],
  'M3':   [5.5,  2.4],
  'M4':   [7.0,  3.2],
  'M5':   [8.0,  4.0],
};

const standoffInchSizes = ['#4-40 UNC', '#6-32 UNC', '#8-32 UNC', '#10-24 UNC'] as const;
const standoffInchHead: Record<string, [number, number]> = {
  '#4-40 UNC':  [4.78, 2.4],
  '#6-32 UNC':  [6.35, 3.2],
  '#8-32 UNC':  [6.35, 3.2],
  '#10-24 UNC': [7.94, 4.0],
};

const inchHexHead: Record<string, [number, number]> = {
  '#10-24 UNC': [inch(0.375), inch(0.120)],
  '1/4-20 UNC': [inch(0.4375), inch(0.163)],
  '5/16-18 UNC': [inch(0.500), inch(0.209)],
  '3/8-16 UNC': [inch(0.5625), inch(0.244)],
  '#10-32 UNF': [inch(0.375), inch(0.120)],
  '1/4-28 UNF': [inch(0.4375), inch(0.163)],
  '5/16-24 UNF': [inch(0.500), inch(0.209)],
  '3/8-24 UNF': [inch(0.5625), inch(0.244)],
};

export const screwDatabase: ScrewData[] = [
  ...metricTorxSizes.map((size) => {
    const [headDiameter, headHeight, driveSize] = iso14580Head[size];
    return makeScrew(threadData[size], 'Socket & Torx', 'ISO 14580', 'Low head cap screw Torx', headDiameter, headHeight, 'Torx', driveSize, true, false);
  }),
  ...metricTorxSizes.map((size) => {
    const [headDiameter, headHeight, driveSize] = iso14581Head[size];
    return makeScrew(threadData[size], 'Socket & Torx', 'ISO 14581', 'Countersunk flat head Torx', headDiameter, headHeight, 'Torx', driveSize, true, true);
  }),
  ...metricTorxSizes.map((size) => {
    const [headDiameter, headHeight, driveSize] = iso14583Head[size];
    return makeScrew(threadData[size], 'Socket & Torx', 'ISO 14583', 'Pan head Torx', headDiameter, headHeight, 'Torx', driveSize, true, false);
  }),
  ...metricTorxSizes.map((size) => {
    const [headDiameter, headHeight, driveSize] = iso4762Head[size];
    return makeScrew(threadData[size], 'Socket & Torx', 'ISO 4762', 'Socket head cap screw', headDiameter, headHeight, 'Hex socket', driveSize, true, false);
  }),
  ...metricMainSizes.map((size) => {
    const [headDiameter, headHeight, driveSize] = iso7380Head[size];
    return makeScrew(threadData[size], 'Socket & Torx', 'ISO 7380-1', 'Button head socket screw', headDiameter, headHeight, 'Hex socket', driveSize, true, false);
  }),
  ...metricMainSizes.map((size) => {
    const [headDiameter, headHeight] = iso4017Head[size];
    return makeScrew(threadData[size], 'External hex', 'ISO 4017', 'Hex head screw', headDiameter, headHeight, 'Hex', `${headDiameter.toFixed(1)} AF`, true, false);
  }),
  ...metricMainSizes.map((size) => {
    const [headDiameter, headHeight] = iso4017Head[size];
    return makeScrew(threadData[size], 'External hex', 'ISO 4014', 'Hex bolt, partially threaded', headDiameter, headHeight, 'Hex', `${headDiameter.toFixed(1)} AF`, true, false, { partiallyThreaded: true });
  }),
  ...metricTorxSizes.map((size) => makeScrew(threadData[size], 'Set & shoulder', 'ISO 4026', 'Set screw hex socket', 0, 0, 'Hex socket', iso4026Drive[size], false, false)),
  ...shoulderSizes.map((size) => {
    const [headDiameter, headHeight, driveSize, shoulderDiameter] = iso7379Head[size];
    return makeScrew(threadData[size], 'Set & shoulder', 'ISO 7379', 'Shoulder bolt', headDiameter, headHeight, 'Hex socket', driveSize, true, false, { shoulderDiameter });
  }),
  ...inchSocketSizes.map((size) => {
    const [headDiameter, headHeight, driveSize] = inchSocketHead[size];
    return makeScrew(threadData[size], 'Inch socket', 'ASME B18.3', 'Socket head cap screw', headDiameter, headHeight, 'Hex socket', driveSize, true, false);
  }),
  ...inchHexSizes.map((size) => {
    const [headDiameter, headHeight] = inchHexHead[size];
    return makeScrew(threadData[size], 'Inch hex', 'ASME B18.2.1', 'Hex cap screw', headDiameter, headHeight, 'Hex', `${headDiameter.toFixed(1)} AF`, true, false);
  }),
  // Hex standoff F/M — male thread end (tightened into tapped hole or nut)
  ...standoffMetricSizes.map((size) => {
    const [headDiameter, headHeight] = standoffMetricHead[size];
    return makeScrew(threadData[size], 'Standoffs', 'Hex standoff F/M', 'Hex standoff, male-female', headDiameter, headHeight, 'Hex', `${headDiameter.toFixed(1)} AF`, true, false);
  }),
  ...standoffInchSizes.map((size) => {
    const [headDiameter, headHeight] = standoffInchHead[size];
    return makeScrew(threadData[size], 'Standoffs', 'Hex standoff F/M', 'Hex standoff, male-female', headDiameter, headHeight, 'Hex', `${headDiameter.toFixed(1)} AF`, true, false);
  }),
].sort((a, b) => {
  if (a.threadSystem !== b.threadSystem) return a.threadSystem.localeCompare(b.threadSystem);
  if (a.family !== b.family) return a.family.localeCompare(b.family);
  if (a.standard !== b.standard) return a.standard.localeCompare(b.standard);
  return a.sortKey - b.sortKey;
});
