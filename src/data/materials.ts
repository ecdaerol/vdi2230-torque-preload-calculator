/**
 * Engineering material properties used by the calculator.
 * Values are representative design-entry values for early sizing,
 * not procurement acceptance limits. Verify critical joints with
 * the exact alloy, temper, process, and temperature condition.
 */
export interface MaterialData {
  name: string;
  category: 'metal' | 'polymer' | 'composite' | 'custom';
  group: string;
  elasticModulus: number;      // GPa
  yieldStrength: number;       // MPa
  shearStrength: number;       // MPa
  compressiveYield: number;    // MPa
  poissonRatio: number;
  creepRisk: 'low' | 'medium' | 'high';
  notes: string;
}

const materials: MaterialData[] = [
  // Aluminum alloys
  { name: 'Aluminum 5052-H32', category: 'metal', group: 'Aluminum alloys', elasticModulus: 70, yieldStrength: 193, shearStrength: 125, compressiveYield: 193, poissonRatio: 0.33, creepRisk: 'low', notes: 'Sheet and enclosure alloy with good formability.' },
  { name: 'Aluminum 6061-T6', category: 'metal', group: 'Aluminum alloys', elasticModulus: 69, yieldStrength: 276, shearStrength: 207, compressiveYield: 276, poissonRatio: 0.33, creepRisk: 'low', notes: 'General-purpose machined aluminum.' },
  { name: 'Aluminum 6082-T6', category: 'metal', group: 'Aluminum alloys', elasticModulus: 69, yieldStrength: 260, shearStrength: 185, compressiveYield: 260, poissonRatio: 0.33, creepRisk: 'low', notes: 'Common European structural/machined alloy.' },
  { name: 'Aluminum 7075-T6', category: 'metal', group: 'Aluminum alloys', elasticModulus: 72, yieldStrength: 503, shearStrength: 331, compressiveYield: 503, poissonRatio: 0.33, creepRisk: 'low', notes: 'High-strength aerospace-style aluminum.' },
  { name: 'Aluminum 2024-T351', category: 'metal', group: 'Aluminum alloys', elasticModulus: 73, yieldStrength: 324, shearStrength: 283, compressiveYield: 324, poissonRatio: 0.33, creepRisk: 'low', notes: 'Good fatigue resistance, less corrosion resistant.' },

  // Steel / stainless
  { name: 'Steel S235', category: 'metal', group: 'Steels & stainless', elasticModulus: 210, yieldStrength: 235, shearStrength: 145, compressiveYield: 235, poissonRatio: 0.30, creepRisk: 'low', notes: 'Mild structural steel.' },
  { name: 'Steel S355', category: 'metal', group: 'Steels & stainless', elasticModulus: 210, yieldStrength: 355, shearStrength: 215, compressiveYield: 355, poissonRatio: 0.30, creepRisk: 'low', notes: 'Common structural/mechanical steel.' },
  { name: 'Steel (generic)', category: 'metal', group: 'Steels & stainless', elasticModulus: 210, yieldStrength: 250, shearStrength: 150, compressiveYield: 250, poissonRatio: 0.30, creepRisk: 'low', notes: 'Generic mild steel reference.' },
  { name: 'Stainless 303 (1.4305)', category: 'metal', group: 'Steels & stainless', elasticModulus: 193, yieldStrength: 240, shearStrength: 180, compressiveYield: 240, poissonRatio: 0.29, creepRisk: 'low', notes: 'Free-machining stainless.' },
  { name: 'Stainless 304 (1.4301)', category: 'metal', group: 'Steels & stainless', elasticModulus: 193, yieldStrength: 215, shearStrength: 170, compressiveYield: 215, poissonRatio: 0.29, creepRisk: 'low', notes: 'General-purpose austenitic stainless.' },
  { name: 'Stainless 316 / 316L', category: 'metal', group: 'Steels & stainless', elasticModulus: 193, yieldStrength: 205, shearStrength: 165, compressiveYield: 205, poissonRatio: 0.29, creepRisk: 'low', notes: 'Better corrosion resistance than 304.' },
  { name: '17-4PH Stainless H900', category: 'metal', group: 'Steels & stainless', elasticModulus: 197, yieldStrength: 1170, shearStrength: 690, compressiveYield: 1170, poissonRatio: 0.27, creepRisk: 'low', notes: 'High-strength precipitation-hardening stainless.' },

  // Other metals
  { name: 'Brass CW614N', category: 'metal', group: 'Specialty metals', elasticModulus: 100, yieldStrength: 220, shearStrength: 150, compressiveYield: 220, poissonRatio: 0.34, creepRisk: 'low', notes: 'Free-machining brass for fittings and inserts.' },
  { name: 'Copper C110', category: 'metal', group: 'Specialty metals', elasticModulus: 117, yieldStrength: 70, shearStrength: 55, compressiveYield: 95, poissonRatio: 0.34, creepRisk: 'low', notes: 'Soft conductive copper.' },
  { name: 'Titanium Ti-6Al-4V', category: 'metal', group: 'Specialty metals', elasticModulus: 114, yieldStrength: 880, shearStrength: 550, compressiveYield: 970, poissonRatio: 0.34, creepRisk: 'low', notes: 'High specific strength, lower stiffness than steel.' },

  // Engineering polymers
  { name: 'ABS', category: 'polymer', group: 'Engineering polymers', elasticModulus: 2.2, yieldStrength: 40, shearStrength: 25, compressiveYield: 60, poissonRatio: 0.35, creepRisk: 'high', notes: 'General-purpose injection-molded thermoplastic.' },
  { name: 'ASA', category: 'polymer', group: 'Engineering polymers', elasticModulus: 2.1, yieldStrength: 42, shearStrength: 26, compressiveYield: 62, poissonRatio: 0.35, creepRisk: 'high', notes: 'Outdoor-stable ABS-like polymer.' },
  { name: 'Polycarbonate (PC)', category: 'polymer', group: 'Engineering polymers', elasticModulus: 2.4, yieldStrength: 65, shearStrength: 38, compressiveYield: 90, poissonRatio: 0.37, creepRisk: 'high', notes: 'Tough transparent engineering thermoplastic.' },
  { name: 'PC/ABS', category: 'polymer', group: 'Engineering polymers', elasticModulus: 2.3, yieldStrength: 55, shearStrength: 32, compressiveYield: 75, poissonRatio: 0.37, creepRisk: 'high', notes: 'Common electronics housing blend.' },
  { name: 'POM (Delrin)', category: 'polymer', group: 'Engineering polymers', elasticModulus: 2.9, yieldStrength: 65, shearStrength: 40, compressiveYield: 80, poissonRatio: 0.35, creepRisk: 'medium', notes: 'Low-friction acetal.' },
  { name: 'PA6', category: 'polymer', group: 'Engineering polymers', elasticModulus: 2.7, yieldStrength: 80, shearStrength: 46, compressiveYield: 95, poissonRatio: 0.39, creepRisk: 'high', notes: 'Nylon 6, moisture sensitive.' },
  { name: 'PA66', category: 'polymer', group: 'Engineering polymers', elasticModulus: 2.9, yieldStrength: 82, shearStrength: 48, compressiveYield: 100, poissonRatio: 0.39, creepRisk: 'high', notes: 'Nylon 66, common molded engineering resin.' },
  { name: 'PEI (Ultem)', category: 'polymer', group: 'Engineering polymers', elasticModulus: 3.3, yieldStrength: 85, shearStrength: 50, compressiveYield: 152, poissonRatio: 0.36, creepRisk: 'medium', notes: 'Higher-temperature amorphous polymer.' },
  { name: 'PEEK (unfilled)', category: 'polymer', group: 'Engineering polymers', elasticModulus: 3.5, yieldStrength: 100, shearStrength: 55, compressiveYield: 130, poissonRatio: 0.40, creepRisk: 'medium', notes: 'Premium high-performance polymer.' },
  { name: 'PPS', category: 'polymer', group: 'Engineering polymers', elasticModulus: 3.6, yieldStrength: 90, shearStrength: 50, compressiveYield: 140, poissonRatio: 0.37, creepRisk: 'medium', notes: 'Stable high-temperature engineering polymer.' },
  { name: 'PP', category: 'polymer', group: 'Engineering polymers', elasticModulus: 1.5, yieldStrength: 32, shearStrength: 20, compressiveYield: 45, poissonRatio: 0.42, creepRisk: 'high', notes: 'Very creep-sensitive low-cost plastic.' },

  // Additive / prototype friendly materials
  { name: 'PETG', category: 'polymer', group: '3D-printing & prototypes', elasticModulus: 2.1, yieldStrength: 45, shearStrength: 28, compressiveYield: 60, poissonRatio: 0.38, creepRisk: 'high', notes: 'Common FDM prototyping material.' },
  { name: 'PLA', category: 'polymer', group: '3D-printing & prototypes', elasticModulus: 3.5, yieldStrength: 55, shearStrength: 32, compressiveYield: 70, poissonRatio: 0.36, creepRisk: 'medium', notes: 'Stiff but temperature-sensitive FDM material.' },
  { name: 'PA12 (SLS/MJF)', category: 'polymer', group: '3D-printing & prototypes', elasticModulus: 1.7, yieldStrength: 48, shearStrength: 28, compressiveYield: 58, poissonRatio: 0.39, creepRisk: 'high', notes: 'Powder-bed additive nylon.' },
  { name: 'PA12 (FDM)', category: 'polymer', group: '3D-printing & prototypes', elasticModulus: 1.2, yieldStrength: 35, shearStrength: 20, compressiveYield: 40, poissonRatio: 0.39, creepRisk: 'high', notes: 'Layer-adhesion dependent nylon print.' },

  // Laminates / composites / filled polymers
  { name: 'FR-4 / G10 laminate', category: 'composite', group: 'Laminates & composites', elasticModulus: 22, yieldStrength: 320, shearStrength: 140, compressiveYield: 420, poissonRatio: 0.14, creepRisk: 'low', notes: 'Glass-epoxy laminate, useful for PCB and plate stacks.' },
  { name: 'GFRP laminate', category: 'composite', group: 'Laminates & composites', elasticModulus: 24, yieldStrength: 350, shearStrength: 160, compressiveYield: 450, poissonRatio: 0.18, creepRisk: 'low', notes: 'Glass-fiber structural laminate.' },
  { name: 'CFRP laminate', category: 'composite', group: 'Laminates & composites', elasticModulus: 55, yieldStrength: 600, shearStrength: 220, compressiveYield: 520, poissonRatio: 0.12, creepRisk: 'low', notes: 'Directional behavior varies strongly with layup.' },
  { name: 'PEEK (30% CF)', category: 'composite', group: 'Filled / reinforced polymers', elasticModulus: 12, yieldStrength: 210, shearStrength: 100, compressiveYield: 240, poissonRatio: 0.38, creepRisk: 'medium', notes: 'Carbon-filled high-temperature polymer.' },
  { name: 'PA12 GF (SLS)', category: 'composite', group: 'Filled / reinforced polymers', elasticModulus: 3.2, yieldStrength: 51, shearStrength: 30, compressiveYield: 65, poissonRatio: 0.35, creepRisk: 'medium', notes: 'Glass-filled powder-bed nylon.' },
  { name: 'PA6 GF30', category: 'composite', group: 'Filled / reinforced polymers', elasticModulus: 9.5, yieldStrength: 185, shearStrength: 95, compressiveYield: 150, poissonRatio: 0.35, creepRisk: 'medium', notes: '30% glass-filled nylon 6.' },
  { name: 'CF Nylon', category: 'composite', group: 'Filled / reinforced polymers', elasticModulus: 6.5, yieldStrength: 110, shearStrength: 60, compressiveYield: 120, poissonRatio: 0.34, creepRisk: 'medium', notes: 'Carbon-fiber reinforced nylon, common in additive parts.' },
  { name: 'GF Nylon', category: 'composite', group: 'Filled / reinforced polymers', elasticModulus: 5.8, yieldStrength: 95, shearStrength: 55, compressiveYield: 110, poissonRatio: 0.35, creepRisk: 'medium', notes: 'Glass-fiber reinforced nylon.' },
];

export const materialDatabase: MaterialData[] = materials.sort((a, b) => {
  if (a.category !== b.category) return a.category.localeCompare(b.category);
  if (a.group !== b.group) return a.group.localeCompare(b.group);
  return a.name.localeCompare(b.name);
});
