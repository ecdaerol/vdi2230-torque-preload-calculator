/**
 * Interface condition presets for simplified torque/preload estimation.
 *
 * Scatter is an indicative fractional band for assembly variation. It combines
 * friction spread and general process repeatability expectations for that
 * condition, but critical programs should still verify with testing.
 */
export interface FrictionPair {
  group: string;
  name: string;
  condition: string;
  muThread: number;
  muHead: number;
  scatter: number; // fractional, e.g. 0.15 for ±15%
  notes?: string;
}

export const frictionDatabase: FrictionPair[] = [
  // Carbon steel / plated steel
  { group: 'Steel / plated steel', name: 'Steel on Steel', condition: 'Dry', muThread: 0.12, muHead: 0.12, scatter: 0.20, notes: 'General dry carbon-steel hardware.' },
  { group: 'Steel / plated steel', name: 'Steel on Steel', condition: 'Oiled', muThread: 0.10, muHead: 0.10, scatter: 0.12, notes: 'Light machine oil or assembly oil.' },
  { group: 'Steel / plated steel', name: 'Steel on Steel', condition: 'Waxed', muThread: 0.10, muHead: 0.10, scatter: 0.12, notes: 'Typical wax-coated fasteners.' },
  { group: 'Steel / plated steel', name: 'Steel on Steel', condition: 'MoS₂', muThread: 0.08, muHead: 0.08, scatter: 0.10, notes: 'Dry-film lubricant.' },
  { group: 'Steel / plated steel', name: 'Steel on Steel', condition: 'Anti-seize', muThread: 0.09, muHead: 0.10, scatter: 0.10, notes: 'Nickel/copper anti-seize style condition.' },
  { group: 'Steel / plated steel', name: 'Steel on Steel', condition: 'Black oxide + oiled', muThread: 0.11, muHead: 0.11, scatter: 0.14 },
  { group: 'Steel / plated steel', name: 'Steel on Steel', condition: 'Zinc plated', muThread: 0.14, muHead: 0.14, scatter: 0.18 },
  { group: 'Steel / plated steel', name: 'Steel on Steel', condition: 'Zinc flake / Geomet', muThread: 0.11, muHead: 0.11, scatter: 0.12 },

  // Aluminum contact surfaces
  { group: 'Aluminum joints', name: 'Steel on Aluminum', condition: 'Dry', muThread: 0.15, muHead: 0.15, scatter: 0.20 },
  { group: 'Aluminum joints', name: 'Steel on Aluminum', condition: 'Oiled', muThread: 0.12, muHead: 0.12, scatter: 0.15 },
  { group: 'Aluminum joints', name: 'Steel on Aluminum', condition: 'Anodized aluminum', muThread: 0.18, muHead: 0.20, scatter: 0.22, notes: 'Harder and less predictable under the head.' },
  { group: 'Aluminum joints', name: 'Steel on Aluminum', condition: 'Anti-seize', muThread: 0.10, muHead: 0.11, scatter: 0.12 },
  { group: 'Aluminum joints', name: 'Stainless on Aluminum', condition: 'Dry', muThread: 0.16, muHead: 0.16, scatter: 0.22 },
  { group: 'Aluminum joints', name: 'Stainless on Aluminum', condition: 'Anodized aluminum', muThread: 0.18, muHead: 0.20, scatter: 0.24 },
  { group: 'Aluminum joints', name: 'Stainless on Aluminum', condition: 'Anti-seize', muThread: 0.10, muHead: 0.11, scatter: 0.12 },

  // Stainless systems
  { group: 'Stainless joints', name: 'Stainless on Stainless', condition: 'Dry', muThread: 0.18, muHead: 0.18, scatter: 0.25, notes: 'Galling risk. Use lubrication for production.' },
  { group: 'Stainless joints', name: 'Stainless on Stainless', condition: 'Passivated + dry', muThread: 0.16, muHead: 0.16, scatter: 0.22 },
  { group: 'Stainless joints', name: 'Stainless on Stainless', condition: 'Waxed / lubricated', muThread: 0.12, muHead: 0.12, scatter: 0.14 },
  { group: 'Stainless joints', name: 'Stainless on Stainless', condition: 'Anti-seize', muThread: 0.10, muHead: 0.10, scatter: 0.10 },

  // Polymers / composites
  { group: 'Polymers & composites', name: 'Steel on PEEK', condition: 'Dry', muThread: 0.12, muHead: 0.18, scatter: 0.22 },
  { group: 'Polymers & composites', name: 'Steel on PA12', condition: 'Dry', muThread: 0.15, muHead: 0.20, scatter: 0.25 },
  { group: 'Polymers & composites', name: 'Steel on POM', condition: 'Dry', muThread: 0.10, muHead: 0.15, scatter: 0.18 },
  { group: 'Polymers & composites', name: 'Steel on PC/ABS', condition: 'Dry', muThread: 0.14, muHead: 0.18, scatter: 0.22 },
  { group: 'Polymers & composites', name: 'Steel on FR-4 / G10', condition: 'Dry', muThread: 0.13, muHead: 0.17, scatter: 0.18 },
  { group: 'Polymers & composites', name: 'Stainless on PA12', condition: 'Dry', muThread: 0.15, muHead: 0.20, scatter: 0.25 },

  // Threadlocker presets
  { group: 'Threadlocker conditions', name: 'Any', condition: 'Loctite 222 (low strength)', muThread: 0.12, muHead: 0.12, scatter: 0.15 },
  { group: 'Threadlocker conditions', name: 'Any', condition: 'Loctite 243 (medium strength)', muThread: 0.14, muHead: 0.14, scatter: 0.15 },
  { group: 'Threadlocker conditions', name: 'Any', condition: 'High-strength threadlocker', muThread: 0.16, muHead: 0.15, scatter: 0.18 },

  // Escape hatch
  { group: 'Custom', name: 'Custom', condition: 'User-defined', muThread: 0.14, muHead: 0.14, scatter: 0.20 },
];
