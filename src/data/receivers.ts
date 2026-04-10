import type { MaterialData } from './materials';

export interface ReceiverPreset {
  key: string;
  label: string;
  description: string;
  internalCapacityFactor: number;
  recommendedCategories: MaterialData['category'][] | 'any';
  notes: string;
}

export const receiverPresets: ReceiverPreset[] = [
  {
    key: 'direct-tapped',
    label: 'Direct tapped material',
    description: 'Threads cut or formed directly in the parent material.',
    internalCapacityFactor: 1.0,
    recommendedCategories: 'any',
    notes: 'Baseline tapped-hole assumption.',
  },
  {
    key: 'helical-insert',
    label: 'Helical wire insert',
    description: 'Wire insert that improves thread load distribution and wear resistance.',
    internalCapacityFactor: 1.25,
    recommendedCategories: 'any',
    notes: 'Useful when a softer base material needs a more durable thread.',
  },
  {
    key: 'solid-insert',
    label: 'Solid insert / Keensert style',
    description: 'Rigid insert with stronger female thread support than a direct tapped hole.',
    internalCapacityFactor: 1.45,
    recommendedCategories: 'any',
    notes: 'Often provides the strongest stripped-thread resistance in the same parent material.',
  },
  {
    key: 'heat-set-insert',
    label: 'Heat-set insert',
    description: 'Knurled insert installed into thermoplastics for repeated assembly.',
    internalCapacityFactor: 1.2,
    recommendedCategories: ['polymer', 'composite'],
    notes: 'Best suited to polymers and filled polymers rather than metals.',
  },
  {
    key: 'rivnut',
    label: 'Rivnut / blind threaded insert',
    description: 'Thin-wall blind insert used in sheet and thin section assemblies.',
    internalCapacityFactor: 0.8,
    recommendedCategories: ['metal'],
    notes: 'Convenient for thin sheet but usually weaker in stripping than a deep tapped block.',
  },
];
