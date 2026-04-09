export interface MaterialData {
  name: string;
  category: 'metal' | 'polymer' | 'composite' | 'custom';
  elasticModulus: number;      // GPa
  yieldStrength: number;       // MPa
  shearStrength: number;       // MPa
  compressiveYield: number;    // MPa
  poissonRatio: number;
  notes: string;
}

export const materialDatabase: MaterialData[] = [
  // Metals
  { name: "Aluminum 6061-T6", category: "metal", elasticModulus: 69, yieldStrength: 276, shearStrength: 207, compressiveYield: 276, poissonRatio: 0.33, notes: "Machined, general purpose" },
  { name: "Aluminum 7075-T6", category: "metal", elasticModulus: 72, yieldStrength: 503, shearStrength: 331, compressiveYield: 503, poissonRatio: 0.33, notes: "Machined, high strength" },
  { name: "Aluminum 5083-H321", category: "metal", elasticModulus: 70, yieldStrength: 228, shearStrength: 145, compressiveYield: 228, poissonRatio: 0.33, notes: "Machined, marine grade" },
  { name: "Steel (generic)", category: "metal", elasticModulus: 210, yieldStrength: 250, shearStrength: 150, compressiveYield: 250, poissonRatio: 0.30, notes: "Mild steel reference" },
  { name: "Stainless 304 (1.4301)", category: "metal", elasticModulus: 193, yieldStrength: 215, shearStrength: 170, compressiveYield: 215, poissonRatio: 0.29, notes: "Austenitic stainless" },
  { name: "Stainless 303 (1.4305)", category: "metal", elasticModulus: 193, yieldStrength: 240, shearStrength: 180, compressiveYield: 210, poissonRatio: 0.29, notes: "Free-machining stainless" },
  // Engineering polymers
  { name: "PEEK (unfilled)", category: "polymer", elasticModulus: 3.5, yieldStrength: 100, shearStrength: 55, compressiveYield: 130, poissonRatio: 0.40, notes: "Injection molded" },
  { name: "PEEK (30% CF)", category: "composite", elasticModulus: 12, yieldStrength: 210, shearStrength: 100, compressiveYield: 240, poissonRatio: 0.38, notes: "Carbon fiber filled" },
  { name: "POM (Delrin)", category: "polymer", elasticModulus: 2.9, yieldStrength: 65, shearStrength: 40, compressiveYield: 80, poissonRatio: 0.35, notes: "Acetal" },
  { name: "PEI (Ultem)", category: "polymer", elasticModulus: 3.3, yieldStrength: 85, shearStrength: 50, compressiveYield: 170, poissonRatio: 0.36, notes: "High-temp polymer" },
  // 3D printed polymers
  { name: "PA12 (SLS/MJF)", category: "polymer", elasticModulus: 1.7, yieldStrength: 48, shearStrength: 28, compressiveYield: 58, poissonRatio: 0.39, notes: "3D printed — HP MJF / EOS SLS" },
  { name: "PA12 (FDM)", category: "polymer", elasticModulus: 1.2, yieldStrength: 35, shearStrength: 20, compressiveYield: 40, poissonRatio: 0.39, notes: "3D printed FDM — layer adhesion dependent" },
  { name: "PA12 GF (SLS)", category: "composite", elasticModulus: 3.2, yieldStrength: 51, shearStrength: 30, compressiveYield: 65, poissonRatio: 0.35, notes: "Glass-filled, 3D printed" },
  { name: "PA6 GF30", category: "composite", elasticModulus: 9.5, yieldStrength: 185, shearStrength: 95, compressiveYield: 150, poissonRatio: 0.35, notes: "30% glass-filled polyamide 6" },
];
