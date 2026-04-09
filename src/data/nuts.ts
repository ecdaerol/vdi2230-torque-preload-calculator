export interface NutData {
  standard: string;
  type: string;
  size: string;
  width: number;           // across flats (mm)
  height: number;          // mm
  bearingDiameter: number; // mm (inscribed circle of hex ≈ width across flats)
}

export const nutDatabase: NutData[] = [
  // ISO 4032 — Hex nut, style 1
  { standard: "ISO 4032", type: "Hex nut", size: "M1.6", width: 3.2, height: 1.3, bearingDiameter: 3.2 },
  { standard: "ISO 4032", type: "Hex nut", size: "M2", width: 4.0, height: 1.6, bearingDiameter: 4.0 },
  { standard: "ISO 4032", type: "Hex nut", size: "M2.5", width: 5.0, height: 2.0, bearingDiameter: 5.0 },
  { standard: "ISO 4032", type: "Hex nut", size: "M3", width: 5.5, height: 2.4, bearingDiameter: 5.5 },
  { standard: "ISO 4032", type: "Hex nut", size: "M4", width: 7.0, height: 3.2, bearingDiameter: 7.0 },
  { standard: "ISO 4032", type: "Hex nut", size: "M5", width: 8.0, height: 4.7, bearingDiameter: 8.0 },
  { standard: "ISO 4032", type: "Hex nut", size: "M6", width: 10.0, height: 5.2, bearingDiameter: 10.0 },
  { standard: "ISO 4032", type: "Hex nut", size: "M8", width: 13.0, height: 6.8, bearingDiameter: 13.0 },
  { standard: "ISO 4032", type: "Hex nut", size: "M10", width: 16.0, height: 8.4, bearingDiameter: 16.0 },
  { standard: "ISO 4032", type: "Hex nut", size: "M12", width: 18.0, height: 10.8, bearingDiameter: 18.0 },

  // ISO 4035 — Hex thin nut (jam nut)
  { standard: "ISO 4035", type: "Thin hex nut", size: "M2", width: 4.0, height: 1.2, bearingDiameter: 4.0 },
  { standard: "ISO 4035", type: "Thin hex nut", size: "M2.5", width: 5.0, height: 1.6, bearingDiameter: 5.0 },
  { standard: "ISO 4035", type: "Thin hex nut", size: "M3", width: 5.5, height: 1.8, bearingDiameter: 5.5 },
  { standard: "ISO 4035", type: "Thin hex nut", size: "M4", width: 7.0, height: 2.2, bearingDiameter: 7.0 },
  { standard: "ISO 4035", type: "Thin hex nut", size: "M5", width: 8.0, height: 2.7, bearingDiameter: 8.0 },
  { standard: "ISO 4035", type: "Thin hex nut", size: "M6", width: 10.0, height: 3.2, bearingDiameter: 10.0 },
  { standard: "ISO 4035", type: "Thin hex nut", size: "M8", width: 13.0, height: 4.0, bearingDiameter: 13.0 },
  { standard: "ISO 4035", type: "Thin hex nut", size: "M10", width: 16.0, height: 5.0, bearingDiameter: 16.0 },
  { standard: "ISO 4035", type: "Thin hex nut", size: "M12", width: 18.0, height: 6.0, bearingDiameter: 18.0 },
];
