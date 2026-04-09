export interface FrictionPair {
  name: string;
  condition: string;
  muThread: number;
  muHead: number;
}

export const frictionDatabase: FrictionPair[] = [
  { name: "Steel on Steel", condition: "Dry", muThread: 0.12, muHead: 0.12 },
  { name: "Steel on Steel", condition: "Oiled", muThread: 0.10, muHead: 0.10 },
  { name: "Steel on Steel", condition: "MoS₂", muThread: 0.08, muHead: 0.08 },
  { name: "Steel on Steel", condition: "Waxed", muThread: 0.10, muHead: 0.10 },
  { name: "Steel on Aluminum", condition: "Dry", muThread: 0.15, muHead: 0.15 },
  { name: "Steel on Aluminum", condition: "Oiled", muThread: 0.12, muHead: 0.12 },
  { name: "Steel on PEEK", condition: "Dry", muThread: 0.12, muHead: 0.18 },
  { name: "Steel on PA12", condition: "Dry", muThread: 0.15, muHead: 0.20 },
  { name: "Steel on POM", condition: "Dry", muThread: 0.10, muHead: 0.15 },
  { name: "Stainless on Stainless", condition: "Dry", muThread: 0.18, muHead: 0.18 },
  { name: "Stainless on Aluminum", condition: "Dry", muThread: 0.16, muHead: 0.16 },
  { name: "Custom", condition: "User-defined", muThread: 0.14, muHead: 0.14 },
];
