export interface MaterialData {
  name: string;
  category: 'metal' | 'polymer' | 'composite' | 'custom';
  elasticModulus: number;
  yieldStrength: number;
  shearStrength: number;
  poissonRatio: number;
  notes: string;
}

export const materialDatabase: MaterialData[] = [
  { name: "Aluminum 6061-T6", category: "metal", elasticModulus: 69, yieldStrength: 276, shearStrength: 207, poissonRatio: 0.33, notes: "Machined" },
  { name: "Aluminum 7075-T6", category: "metal", elasticModulus: 72, yieldStrength: 503, shearStrength: 331, poissonRatio: 0.33, notes: "Machined" },
  { name: "Aluminum 5083-H321", category: "metal", elasticModulus: 70, yieldStrength: 228, shearStrength: 145, poissonRatio: 0.33, notes: "Machined, marine grade" },
  { name: "PEEK (unfilled)", category: "polymer", elasticModulus: 3.5, yieldStrength: 100, shearStrength: 55, poissonRatio: 0.40, notes: "Injection molded" },
  { name: "PEEK (30% CF)", category: "composite", elasticModulus: 12, yieldStrength: 210, shearStrength: 100, poissonRatio: 0.38, notes: "Injection molded" },
  { name: "PA12 (SLS/MJF)", category: "polymer", elasticModulus: 1.7, yieldStrength: 48, shearStrength: 28, poissonRatio: 0.39, notes: "3D printed — HP MJF / EOS SLS" },
  { name: "PA12 (FDM)", category: "polymer", elasticModulus: 1.2, yieldStrength: 35, shearStrength: 20, poissonRatio: 0.39, notes: "3D printed FDM — layer adhesion dependent" },
  { name: "PA12 GF (SLS)", category: "composite", elasticModulus: 3.2, yieldStrength: 51, shearStrength: 30, poissonRatio: 0.35, notes: "Glass-filled, 3D printed" },
  { name: "POM (Delrin)", category: "polymer", elasticModulus: 2.9, yieldStrength: 65, shearStrength: 40, poissonRatio: 0.35, notes: "Acetal" },
  { name: "Steel (generic)", category: "metal", elasticModulus: 210, yieldStrength: 250, shearStrength: 150, poissonRatio: 0.30, notes: "Mild steel reference" },
  { name: "Stainless 304", category: "metal", elasticModulus: 193, yieldStrength: 215, shearStrength: 170, poissonRatio: 0.29, notes: "Austenitic stainless" },
];
