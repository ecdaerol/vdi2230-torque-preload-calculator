/**
 * Friction coefficients per VDI 2230 Table A1 and VDI 2230 Supplement.
 * Scatter bands are typical ranges from bolting handbooks.
 * Actual friction depends on surface finish, coating, lubricant batch,
 * and tightening speed. Verify experimentally for critical applications.
 */
export interface FrictionPair {
  name: string;
  condition: string;
  muThread: number;
  muHead: number;
  scatter: number; // fractional, e.g. 0.20 for ±20%
}

export const frictionDatabase: FrictionPair[] = [
  // Steel bolt on steel/metal
  { name: "Steel on Steel", condition: "Dry", muThread: 0.12, muHead: 0.12, scatter: 0.20 },
  { name: "Steel on Steel", condition: "Oiled", muThread: 0.10, muHead: 0.10, scatter: 0.12 },
  { name: "Steel on Steel", condition: "MoS₂", muThread: 0.08, muHead: 0.08, scatter: 0.10 },
  { name: "Steel on Steel", condition: "Waxed", muThread: 0.10, muHead: 0.10, scatter: 0.12 },
  { name: "Steel on Aluminum", condition: "Dry", muThread: 0.15, muHead: 0.15, scatter: 0.20 },
  { name: "Steel on Aluminum", condition: "Oiled", muThread: 0.12, muHead: 0.12, scatter: 0.15 },
  // Stainless bolt combos (A2/A4)
  { name: "Stainless on Stainless", condition: "Dry", muThread: 0.18, muHead: 0.18, scatter: 0.25 },
  { name: "Stainless on Aluminum", condition: "Dry", muThread: 0.16, muHead: 0.16, scatter: 0.22 },
  { name: "Stainless on PEEK", condition: "Dry", muThread: 0.12, muHead: 0.18, scatter: 0.22 },
  { name: "Stainless on PA12", condition: "Dry", muThread: 0.15, muHead: 0.20, scatter: 0.25 },
  { name: "Stainless on POM", condition: "Dry", muThread: 0.10, muHead: 0.15, scatter: 0.20 },
  { name: "Stainless on PEI", condition: "Dry", muThread: 0.14, muHead: 0.18, scatter: 0.22 },
  // Steel on polymers
  { name: "Steel on PEEK", condition: "Dry", muThread: 0.12, muHead: 0.18, scatter: 0.22 },
  { name: "Steel on PA12", condition: "Dry", muThread: 0.15, muHead: 0.20, scatter: 0.25 },
  { name: "Steel on POM", condition: "Dry", muThread: 0.10, muHead: 0.15, scatter: 0.18 },
  // Thread-lock variants
  { name: "Any", condition: "Loctite 222 (low)", muThread: 0.12, muHead: 0.12, scatter: 0.15 },
  { name: "Any", condition: "Loctite 243 (medium)", muThread: 0.14, muHead: 0.14, scatter: 0.15 },
  // Custom
  { name: "Custom", condition: "User-defined", muThread: 0.14, muHead: 0.14, scatter: 0.20 },
];
