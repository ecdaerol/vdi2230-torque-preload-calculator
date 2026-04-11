import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TorquePreloadCard from './results/TorquePreloadCard';
import BoltStressCard from './results/BoltStressCard';
import { SurfacePressureCard, ThreadStrippingCard, JointStiffnessCard } from './results/SafetyChecksCard';
import OperatingStateCard from './results/OperatingStateCard';
import { getUnitFactors } from './results/ResultsUtils';

const metricUnits = getUnitFactors(false);
const imperialUnits = getUnitFactors(true);

describe('TorquePreloadCard', () => {
  const servicePreload = {
    initial: { preloadNominal: 10000, preloadMin: 8000, preloadMax: 12000 },
    service: { preloadNominal: 9000, preloadMin: 7200, preloadMax: 10800 },
    relaxationLoss: 500,
    embeddingLoss: 500,
    equivalentStiffness: 200000,
  };

  it('renders torque and preload values', () => {
    render(
      <TorquePreloadCard torque={25} torqueMin={20} torqueMax={30}
        servicePreload={servicePreload} serviceLossPercent={10} units={metricUnits} />
    );
    expect(screen.getByText(/Tightening Torque/i)).toBeInTheDocument();
    expect(screen.getByText(/Initial Preload/i)).toBeInTheDocument();
    expect(screen.getByText(/Service Preload/i)).toBeInTheDocument();
  });

  it('applies warning color when loss exceeds 20%', () => {
    const { container } = render(
      <TorquePreloadCard torque={25} torqueMin={20} torqueMax={30}
        servicePreload={servicePreload} serviceLossPercent={25} units={metricUnits} />
    );
    // Service preload should use warning color
    const serviceValue = container.querySelectorAll('.text-2xl')[2];
    expect(serviceValue?.getAttribute('style')).toContain('--warn');
  });

  it('converts to imperial units', () => {
    render(
      <TorquePreloadCard torque={25} torqueMin={20} torqueMax={30}
        servicePreload={servicePreload} serviceLossPercent={10} units={imperialUnits} />
    );
    expect(screen.getAllByText(/lb·ft/)).toHaveLength(2);
    expect(screen.getAllByText(/lbf/).length).toBeGreaterThan(0);
  });
});

describe('BoltStressCard', () => {
  const boltStress = {
    axialStress: 400,
    torsionalStress: 120,
    vonMisesStress: 450,
    utilization: 75,
  };

  const grade = { name: '8.8', Rp02: 640, Rm: 800, minArea: 0 };

  it('renders stress values and utilization bar', () => {
    render(
      <BoltStressCard boltStress={boltStress} grade={grade}
        inputMode="utilization" utilization={75} units={metricUnits} />
    );
    expect(screen.getByText(/σ axial/)).toBeInTheDocument();
    expect(screen.getByText(/τ torsion/)).toBeInTheDocument();
    expect(screen.getByText(/Von Mises Utilization/i)).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });

  it('shows danger when utilization > 100%', () => {
    const overloaded = { ...boltStress, utilization: 110, vonMisesStress: 700 };
    render(
      <BoltStressCard boltStress={overloaded} grade={grade}
        inputMode="torque" utilization={100} units={metricUnits} />
    );
    expect(screen.getByText(/Bolt proof load exceeded/)).toBeInTheDocument();
  });
});

describe('SurfacePressureCard', () => {
  const screw = { hasHead: true, isCountersunk: false } as any;

  it('shows N/A for set screws', () => {
    render(
      <SurfacePressureCard side="head" sp={null} material={null}
        washer={null} screw={{ hasHead: false } as any} available={false} units={metricUnits} />
    );
    expect(screen.getByText(/N\/A for set screws/)).toBeInTheDocument();
  });

  it('renders pressure data when available', () => {
    const sp = { pressure: 150, limit: 300, safetyFactor: 2.0, bearingArea: 100, status: 'ok' as const };
    render(
      <SurfacePressureCard side="head" sp={sp} material={{ name: 'Steel' } as any}
        washer={null} screw={screw} available={true} units={metricUnits} />
    );
    expect(screen.getByText(/150.0/)).toBeInTheDocument();
    expect(screen.getAllByText('OK').length).toBeGreaterThan(0);
  });
});

describe('OperatingStateCard', () => {
  it('shows prompt when no loads entered', () => {
    render(
      <OperatingStateCard operatingState={null} axialServiceLoad={0}
        shearServiceLoad={0} slipFriction={0.15} units={metricUnits} />
    );
    expect(screen.getByText(/Enter axial or transverse/)).toBeInTheDocument();
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });

  it('shows stiffness needed message when loads but no stiffness', () => {
    render(
      <OperatingStateCard operatingState={null} axialServiceLoad={5000}
        shearServiceLoad={0} slipFriction={0.15} units={metricUnits} />
    );
    expect(screen.getByText(/clamp stiffness model/)).toBeInTheDocument();
  });

  it('renders full operating state data', () => {
    const os = {
      additionalBoltLoad: 500,
      remainingClampForce: 4500,
      boltForceUnderAxialLoad: 5500,
      separationLoad: 20000,
      separationMargin: 4.0,
      availableSlipResistance: 1350,
      slipSafetyFactor: 2.7,
      shearStress: 50,
      shearAllowable: 200,
      shearSafetyFactor: 4.0,
      boltLoadShare: 0.1,
      clampLoadShare: 0.9,
      isSeparated: false,
      willSlip: false,
      interfaceCount: 1,
    };
    render(
      <OperatingStateCard operatingState={os} axialServiceLoad={5000}
        shearServiceLoad={1000} slipFriction={0.15} units={metricUnits} />
    );
    expect(screen.getAllByText('OK').length).toBeGreaterThan(0);
    expect(screen.getByText(/Separation load/)).toBeInTheDocument();
    expect(screen.getByText(/Slip resistance/)).toBeInTheDocument();
  });
});

describe('ThreadStrippingCard', () => {
  it('shows N/A for through-nut assembly', () => {
    render(
      <ThreadStrippingCard ts={null} tappedMaterial={null}
        assemblyType="through-nut" units={metricUnits} />
    );
    expect(screen.getByText(/N\/A — through-bolt/)).toBeInTheDocument();
  });
});

describe('JointStiffnessCard', () => {
  it('renders stiffness values', () => {
    const js = { boltStiffness: 300000, clampStiffness: 900000, loadFactor: 0.25 } as any;
    render(
      <JointStiffnessCard js={js} clampedMaterial={{ name: 'Steel' } as any}
        tappedMaterial={null} clampLength={20} clampLengthSplit={10} />
    );
    expect(screen.getAllByText(/300.0/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/900.0/).length).toBeGreaterThan(0);
    expect(screen.getByText(/0.250/)).toBeInTheDocument();
  });
});

describe('Unit conversion', () => {
  it('metric units are identity', () => {
    expect(metricUnits.Nto).toBe(1);
    expect(metricUnits.Nmto).toBe(1);
    expect(metricUnits.forceUnit).toBe('N');
  });

  it('imperial units convert correctly', () => {
    expect(imperialUnits.Nto).toBeCloseTo(0.2248, 3);
    expect(imperialUnits.Nmto).toBeCloseTo(0.7376, 3);
    expect(imperialUnits.forceUnit).toBe('lbf');
  });
});
