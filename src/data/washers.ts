/**
 * Washer dimensions per ISO 7089 (normal), ISO 7092 (small), ISO 7093-1 (large).
 */
export interface WasherData {
  standard: string;
  type: string;
  size: string;          // e.g. "M3"
  innerDiameter: number; // mm (hole)
  outerDiameter: number; // mm
  thickness: number;     // mm
}

export const washerDatabase: WasherData[] = [
  // ISO 7089 — Plain washer, normal series
  { standard: "ISO 7089", type: "Normal", size: "M1.6", innerDiameter: 1.7, outerDiameter: 4.0, thickness: 0.3 },
  { standard: "ISO 7089", type: "Normal", size: "M2", innerDiameter: 2.2, outerDiameter: 5.0, thickness: 0.3 },
  { standard: "ISO 7089", type: "Normal", size: "M2.5", innerDiameter: 2.7, outerDiameter: 6.0, thickness: 0.5 },
  { standard: "ISO 7089", type: "Normal", size: "M3", innerDiameter: 3.2, outerDiameter: 7.0, thickness: 0.5 },
  { standard: "ISO 7089", type: "Normal", size: "M4", innerDiameter: 4.3, outerDiameter: 9.0, thickness: 0.8 },
  { standard: "ISO 7089", type: "Normal", size: "M5", innerDiameter: 5.3, outerDiameter: 10.0, thickness: 1.0 },
  { standard: "ISO 7089", type: "Normal", size: "M6", innerDiameter: 6.4, outerDiameter: 12.0, thickness: 1.6 },
  { standard: "ISO 7089", type: "Normal", size: "M8", innerDiameter: 8.4, outerDiameter: 16.0, thickness: 1.6 },
  { standard: "ISO 7089", type: "Normal", size: "M10", innerDiameter: 10.5, outerDiameter: 20.0, thickness: 2.0 },
  { standard: "ISO 7089", type: "Normal", size: "M12", innerDiameter: 13.0, outerDiameter: 24.0, thickness: 2.5 },

  // ISO 7092 — Plain washer, small series (reduced OD)
  { standard: "ISO 7092", type: "Small", size: "M1.6", innerDiameter: 1.7, outerDiameter: 3.5, thickness: 0.3 },
  { standard: "ISO 7092", type: "Small", size: "M2", innerDiameter: 2.2, outerDiameter: 4.5, thickness: 0.3 },
  { standard: "ISO 7092", type: "Small", size: "M2.5", innerDiameter: 2.7, outerDiameter: 5.0, thickness: 0.5 },
  { standard: "ISO 7092", type: "Small", size: "M3", innerDiameter: 3.2, outerDiameter: 6.0, thickness: 0.5 },
  { standard: "ISO 7092", type: "Small", size: "M4", innerDiameter: 4.3, outerDiameter: 8.0, thickness: 0.8 },
  { standard: "ISO 7092", type: "Small", size: "M5", innerDiameter: 5.3, outerDiameter: 9.0, thickness: 1.0 },
  { standard: "ISO 7092", type: "Small", size: "M6", innerDiameter: 6.4, outerDiameter: 11.0, thickness: 1.6 },
  { standard: "ISO 7092", type: "Small", size: "M8", innerDiameter: 8.4, outerDiameter: 15.0, thickness: 1.6 },
  { standard: "ISO 7092", type: "Small", size: "M10", innerDiameter: 10.5, outerDiameter: 18.0, thickness: 2.0 },
  { standard: "ISO 7092", type: "Small", size: "M12", innerDiameter: 13.0, outerDiameter: 20.0, thickness: 2.5 },

  // ISO 7093-1 — Plain washer, large series (increased OD for soft materials)
  { standard: "ISO 7093-1", type: "Large", size: "M3", innerDiameter: 3.2, outerDiameter: 9.0, thickness: 0.8 },
  { standard: "ISO 7093-1", type: "Large", size: "M4", innerDiameter: 4.3, outerDiameter: 12.0, thickness: 1.0 },
  { standard: "ISO 7093-1", type: "Large", size: "M5", innerDiameter: 5.3, outerDiameter: 15.0, thickness: 1.2 },
  { standard: "ISO 7093-1", type: "Large", size: "M6", innerDiameter: 6.4, outerDiameter: 18.0, thickness: 1.6 },
  { standard: "ISO 7093-1", type: "Large", size: "M8", innerDiameter: 8.4, outerDiameter: 24.0, thickness: 2.0 },
  { standard: "ISO 7093-1", type: "Large", size: "M10", innerDiameter: 10.5, outerDiameter: 30.0, thickness: 2.5 },
  { standard: "ISO 7093-1", type: "Large", size: "M12", innerDiameter: 13.0, outerDiameter: 37.0, thickness: 3.0 },
];
