export interface ScrewData {
  standard: string;
  type: string;
  size: string;
  d: number;
  pitch: number;
  d2: number;
  d3: number;
  stressArea: number;
  headDiameter: number;
  headHeight: number;
  torxSize: string;
  holeDiameter: number;
}

export const screwDatabase: ScrewData[] = [
  // ISO 14580 — Pan head Torx
  { standard: "ISO 14580", type: "Pan head Torx", size: "M2", d: 2, pitch: 0.4, d2: 1.740, d3: 1.509, stressArea: 2.07, headDiameter: 4.0, headHeight: 1.6, torxSize: "T6", holeDiameter: 2.4 },
  { standard: "ISO 14580", type: "Pan head Torx", size: "M2.5", d: 2.5, pitch: 0.45, d2: 2.208, d3: 1.948, stressArea: 3.39, headDiameter: 5.0, headHeight: 2.0, torxSize: "T8", holeDiameter: 2.9 },
  { standard: "ISO 14580", type: "Pan head Torx", size: "M3", d: 3, pitch: 0.5, d2: 2.675, d3: 2.387, stressArea: 5.03, headDiameter: 5.5, headHeight: 2.4, torxSize: "T10", holeDiameter: 3.4 },
  { standard: "ISO 14580", type: "Pan head Torx", size: "M4", d: 4, pitch: 0.7, d2: 3.545, d3: 3.141, stressArea: 8.78, headDiameter: 7.0, headHeight: 3.2, torxSize: "T20", holeDiameter: 4.5 },
  { standard: "ISO 14580", type: "Pan head Torx", size: "M5", d: 5, pitch: 0.8, d2: 4.480, d3: 4.019, stressArea: 14.2, headDiameter: 8.5, headHeight: 4.0, torxSize: "T25", holeDiameter: 5.5 },
  { standard: "ISO 14580", type: "Pan head Torx", size: "M6", d: 6, pitch: 1.0, d2: 5.350, d3: 4.773, stressArea: 20.1, headDiameter: 10.0, headHeight: 4.8, torxSize: "T30", holeDiameter: 6.6 },
  { standard: "ISO 14580", type: "Pan head Torx", size: "M8", d: 8, pitch: 1.25, d2: 7.188, d3: 6.466, stressArea: 36.6, headDiameter: 13.0, headHeight: 6.4, torxSize: "T40", holeDiameter: 9.0 },
  { standard: "ISO 14580", type: "Pan head Torx", size: "M10", d: 10, pitch: 1.5, d2: 9.026, d3: 8.160, stressArea: 58.0, headDiameter: 16.0, headHeight: 8.0, torxSize: "T45", holeDiameter: 11.0 },
  { standard: "ISO 14580", type: "Pan head Torx", size: "M12", d: 12, pitch: 1.75, d2: 10.863, d3: 9.853, stressArea: 84.3, headDiameter: 18.0, headHeight: 9.6, torxSize: "T50", holeDiameter: 13.5 },
  // ISO 14581 — Countersunk Torx
  { standard: "ISO 14581", type: "Countersunk Torx", size: "M2", d: 2, pitch: 0.4, d2: 1.740, d3: 1.509, stressArea: 2.07, headDiameter: 3.8, headHeight: 1.1, torxSize: "T6", holeDiameter: 2.4 },
  { standard: "ISO 14581", type: "Countersunk Torx", size: "M2.5", d: 2.5, pitch: 0.45, d2: 2.208, d3: 1.948, stressArea: 3.39, headDiameter: 4.7, headHeight: 1.5, torxSize: "T8", holeDiameter: 2.9 },
  { standard: "ISO 14581", type: "Countersunk Torx", size: "M3", d: 3, pitch: 0.5, d2: 2.675, d3: 2.387, stressArea: 5.03, headDiameter: 6.0, headHeight: 1.65, torxSize: "T10", holeDiameter: 3.4 },
  { standard: "ISO 14581", type: "Countersunk Torx", size: "M4", d: 4, pitch: 0.7, d2: 3.545, d3: 3.141, stressArea: 8.78, headDiameter: 8.0, headHeight: 2.2, torxSize: "T20", holeDiameter: 4.5 },
  { standard: "ISO 14581", type: "Countersunk Torx", size: "M5", d: 5, pitch: 0.8, d2: 4.480, d3: 4.019, stressArea: 14.2, headDiameter: 10.0, headHeight: 2.75, torxSize: "T25", holeDiameter: 5.5 },
  { standard: "ISO 14581", type: "Countersunk Torx", size: "M6", d: 6, pitch: 1.0, d2: 5.350, d3: 4.773, stressArea: 20.1, headDiameter: 12.0, headHeight: 3.3, torxSize: "T30", holeDiameter: 6.6 },
  { standard: "ISO 14581", type: "Countersunk Torx", size: "M8", d: 8, pitch: 1.25, d2: 7.188, d3: 6.466, stressArea: 36.6, headDiameter: 16.0, headHeight: 4.4, torxSize: "T40", holeDiameter: 9.0 },
  { standard: "ISO 14581", type: "Countersunk Torx", size: "M10", d: 10, pitch: 1.5, d2: 9.026, d3: 8.160, stressArea: 58.0, headDiameter: 20.0, headHeight: 5.5, torxSize: "T45", holeDiameter: 11.0 },
  { standard: "ISO 14581", type: "Countersunk Torx", size: "M12", d: 12, pitch: 1.75, d2: 10.863, d3: 9.853, stressArea: 84.3, headDiameter: 24.0, headHeight: 6.5, torxSize: "T50", holeDiameter: 13.5 },
];
