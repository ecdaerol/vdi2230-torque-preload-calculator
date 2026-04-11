export interface GoldenCase {
  id: string;
  screwStandard: string;
  screwSize: string;
  frictionName: string;
  frictionCondition: string;
  preloadN: number;
  expectedTorqueNm: number;
  toleranceNm: number;
}

export const goldenCases: GoldenCase[] = [
  {
    id: 'metric-m8-dry-20kn',
    screwStandard: 'ISO 14580',
    screwSize: 'M8',
    frictionName: 'Steel on Steel',
    frictionCondition: 'Dry',
    preloadN: 20000,
    expectedTorqueNm: 27.2,
    toleranceNm: 0.8,
  },
  {
    id: 'metric-m10-dry-33kn',
    screwStandard: 'ISO 14580',
    screwSize: 'M10',
    frictionName: 'Steel on Steel',
    frictionCondition: 'Dry',
    preloadN: 33408,
    expectedTorqueNm: 56.1,
    toleranceNm: 0.8,
  },
  {
    id: 'metric-m6-oiled-8kn',
    screwStandard: 'ISO 14580',
    screwSize: 'M6',
    frictionName: 'Steel on Steel',
    frictionCondition: 'Oiled',
    preloadN: 8000,
    expectedTorqueNm: 7.1,
    toleranceNm: 0.5,
  },
  {
    id: 'inch-quarter20-dry-6kn',
    screwStandard: 'ASME B18.3',
    screwSize: '1/4-20',
    frictionName: 'Steel on Steel',
    frictionCondition: 'Dry',
    preloadN: 6000,
    expectedTorqueNm: 6.5,
    toleranceNm: 0.5,
  },
  {
    id: 'metric-m4-set-dry-5kn',
    screwStandard: 'ISO 4026',
    screwSize: 'M4',
    frictionName: 'Steel on Steel',
    frictionCondition: 'Dry',
    preloadN: 5000,
    expectedTorqueNm: 2.0,
    toleranceNm: 0.5,
  },
];
