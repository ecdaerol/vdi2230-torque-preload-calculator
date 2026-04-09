export interface FrictionPair {
  name: string;
  condition: string;
  muThread: number;
  muHead: number;
}

export const frictionDatabase: FrictionPair[] = [
  // Steel bolt on steel/metal
  { name: "Steel on Steel", condition: "Dry", muThread: 0.12, muHead: 0.12 },
  { name: "Steel on Steel", condition: "Oiled", muThread: 0.10, muHead: 0.10 },
  { name: "Steel on Steel", condition: "MoS₂", muThread: 0.08, muHead: 0.08 },
  { name: "Steel on Steel", condition: "Waxed", muThread: 0.10, muHead: 0.10 },
  { name: "Steel on Aluminum", condition: "Dry", muThread: 0.15, muHead: 0.15 },
  { name: "Steel on Aluminum", condition: "Oiled", muThread: 0.12, muHead: 0.12 },
  // Stainless bolt combos (A2/A4)
  { name: "Stainless on Stainless", condition: "Dry", muThread: 0.18, muHead: 0.18 },
  { name: "Stainless on Aluminum", condition: "Dry", muThread: 0.16, muHead: 0.16 },
  { name: "Stainless on PEEK", condition: "Dry", muThread: 0.12, muHead: 0.18 },
  { name: "Stainless on PA12", condition: "Dry", muThread: 0.15, muHead: 0.20 },
  { name: "Stainless on POM", condition: "Dry", muThread: 0.10, muHead: 0.15 },
  { name: "Stainless on PEI", condition: "Dry", muThread: 0.14, muHead: 0.18 },
  // Steel on polymers
  { name: "Steel on PEEK", condition: "Dry", muThread: 0.12, muHead: 0.18 },
  { name: "Steel on PA12", condition: "Dry", muThread: 0.15, muHead: 0.20 },
  { name: "Steel on POM", condition: "Dry", muThread: 0.10, muHead: 0.15 },
  // Thread-lock variants
  { name: "Any", condition: "Loctite 222 (low)", muThread: 0.12, muHead: 0.12 },
  { name: "Any", condition: "Loctite 243 (medium)", muThread: 0.14, muHead: 0.14 },
  // Custom
  { name: "Custom", condition: "User-defined", muThread: 0.14, muHead: 0.14 },
];
