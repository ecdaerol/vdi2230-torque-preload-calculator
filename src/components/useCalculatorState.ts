import { useCallback, useMemo, useState } from 'react';
import { AssemblyType } from './AssemblyDiagram';
import { ScrewData } from '../data/screws';
import { MaterialData } from '../data/materials';
import { FrictionPair, frictionDatabase } from '../data/friction';
import { washerDatabase } from '../data/washers';
import { nutDatabase } from '../data/nuts';
import { receiverPresets } from '../data/receivers';
import { boltGrades, calculateTorque, calculatePreload } from '../calc/torque';
import { tighteningMethods } from '../calc/preloadRealism';
import { calculateSurfacePressure } from '../calc/surfacePressure';
import { calculateThreadStripping } from '../calc/threadStripping';

const NM_PER_LBFT = 1.355818;
const N_PER_LBF = 4.44822;

export type TurnedSide = 'head' | 'nut';

export interface AssemblyLimit {
  preload: number;
  mode: string;
}

export default function useCalculatorState() {
  const [utilization, setUtilization] = useState(70);
  const [screw, setScrew] = useState<ScrewData | null>(null);
  const [clampedMaterial, setClampedMaterial] = useState<MaterialData | null>(null);
  const [tappedMaterial, setTappedMaterial] = useState<MaterialData | null>(null);
  const [frictionIdx, setFrictionIdx] = useState(0);
  const [customFriction, setCustomFriction] = useState<FrictionPair | null>(null);
  const [gradeIdx, setGradeIdx] = useState(0);
  const [engagementLength, setEngagementLength] = useState(0);
  const [clampLength, setClampLength] = useState(0);
  const [clampLengthSplit, setClampLengthSplit] = useState(0);
  const [useImperial, setUseImperial] = useState(false);
  const [inputMode, setInputMode] = useState<'utilization' | 'torque' | 'preload'>('utilization');
  const [torqueInput, setTorqueInput] = useState(0);
  const [preloadInput, setPreloadInput] = useState(0);
  const [assemblyType, setAssemblyType] = useState<AssemblyType>('tapped-hole');
  const [headWasherIdx, setHeadWasherIdx] = useState(-1);
  const [nutWasherIdx, setNutWasherIdx] = useState(-1);
  const [nutIdx, setNutIdx] = useState(0);
  const [tighteningMethodIdx, setTighteningMethodIdx] = useState(1);
  const [relaxationLossPct, setRelaxationLossPct] = useState(5);
  const [settlementMicrons, setSettlementMicrons] = useState(0);
  const [receiverPresetIdx, setReceiverPresetIdx] = useState(0);
  const [axialLoadInput, setAxialLoadInput] = useState(0);
  const [shearLoadInput, setShearLoadInput] = useState(0);
  const [slipFriction, setSlipFriction] = useState(0.15);
  const [turnedSide, setTurnedSide] = useState<TurnedSide>('nut'); // FIX #2/#6
  const [interfaceCount, setInterfaceCount] = useState(1);          // FIX #5

  const friction = customFriction ?? frictionDatabase[frictionIdx];
  const grade = boltGrades[gradeIdx];
  const tighteningMethod = tighteningMethods[tighteningMethodIdx];
  const receiverPreset = receiverPresets[receiverPresetIdx];

  const frictionGroups = useMemo(() => {
    const groups = new Map<string, { item: FrictionPair; index: number }[]>();
    frictionDatabase.forEach((item, index) => {
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group)!.push({ item, index });
    });
    return Array.from(groups.entries());
  }, []);

  const matchingWashers = useMemo(
    () => screw ? washerDatabase.filter((w) => w.size === screw.size).sort((a, b) => a.outerDiameter - b.outerDiameter) : [],
    [screw],
  );
  const matchingNuts = useMemo(
    () => screw ? nutDatabase.filter((n) => n.size === screw.size).sort((a, b) => a.bearingDiameter - b.bearingDiameter) : [],
    [screw],
  );

  const canUseHeadWasher = !!screw && screw.hasHead && !screw.isCountersunk;
  const setScrewOnlyModes = !!screw && !screw.hasHead;

  const headWasher = canUseHeadWasher && headWasherIdx >= 0 && headWasherIdx < matchingWashers.length
    ? matchingWashers[headWasherIdx] : null;
  const nutWasher = assemblyType === 'through-nut' && nutWasherIdx >= 0 && nutWasherIdx < matchingWashers.length
    ? matchingWashers[nutWasherIdx] : null;
  const nut = assemblyType === 'through-nut' && matchingNuts.length > 0 && nutIdx >= 0 && nutIdx < matchingNuts.length
    ? matchingNuts[nutIdx] : null;

  const handleScrewChange = useCallback((nextScrew: ScrewData) => {
    setScrew(nextScrew);
    if (engagementLength === 0 || engagementLength === (screw?.d ?? 0) * 1.5) {
      setEngagementLength(parseFloat((nextScrew.d * 1.5).toFixed(1)));
    }
    if (clampLength === 0 || clampLength === (screw?.d ?? 0) * 2) {
      const next = parseFloat((nextScrew.d * 2).toFixed(1));
      setClampLength(next);
      setClampLengthSplit(next);
    }
    if (nextScrew.size !== screw?.size) {
      setHeadWasherIdx(-1);
      setNutWasherIdx(-1);
      setNutIdx(0);
    }
    if (!nextScrew.hasHead || nextScrew.isCountersunk) setHeadWasherIdx(-1);
    if (nextScrew.type.toLowerCase().includes('standoff')) {
      setHeadWasherIdx(-1);
      setClampedMaterial(null);
    }
    if (!nextScrew.hasHead && assemblyType !== 'tapped-hole') setAssemblyType('tapped-hole');
  }, [assemblyType, clampLength, engagementLength, screw]);

  const snapPercent = (v: number) => Math.max(0, Math.min(100, Math.round(v / 5) * 5));

  // --- Bearing geometry ---
  // Head-side bearing (for surface pressure and stiffness)
  const headBearingOD = headWasher ? headWasher.outerDiameter : undefined;
  const headBearingID = headWasher ? headWasher.innerDiameter : undefined;

  // Nut-side bearing (for surface pressure, stiffness, and torque when nut is turned)
  const nutBearingOD = nutWasher ? nutWasher.outerDiameter : (nut ? nut.bearingDiameter : undefined);
  const nutBearingID = nutWasher ? nutWasher.innerDiameter : (screw ? screw.holeDiameter : undefined);

  // FIX #2: torque bearing depends on which side is being turned
  const effectiveTurnedSide = assemblyType === 'through-nut' ? turnedSide : ('head' as const);
  const torqueBearingOD = effectiveTurnedSide === 'nut' ? nutBearingOD : headBearingOD;
  const torqueBearingID = effectiveTurnedSide === 'nut' ? nutBearingID : headBearingID;

  // ---------------------------------------------------------------------------
  // Assembly capacity: the weakest-link preload across all failure modes.
  // ---------------------------------------------------------------------------
  const assemblyCapacity = useMemo((): AssemblyLimit => {
    if (!screw) return { preload: 0, mode: 'none' };

    const limits: AssemblyLimit[] = [];

    // 1. Bolt yield
    limits.push({ preload: grade.Rp02 * screw.stressArea, mode: 'Bolt yield' });

    // 2. Head surface pressure
    if (screw.hasHead && !screw.isCountersunk && clampedMaterial) {
      const sp = calculateSurfacePressure(1, screw, clampedMaterial, headBearingOD, headBearingID);
      if (sp.bearingArea > 0) {
        limits.push({ preload: sp.limit * sp.bearingArea, mode: `Surface pressure (${clampedMaterial.name})` });
      }
    }

    // 3. Nut-side surface pressure
    if (assemblyType === 'through-nut' && tappedMaterial && nut) {
      const nOD = nutWasher ? nutWasher.outerDiameter : nut.bearingDiameter;
      const nID = nutWasher ? nutWasher.innerDiameter : screw.holeDiameter;
      const spNut = calculateSurfacePressure(1, screw, tappedMaterial, nOD, nID);
      if (spNut.bearingArea > 0) {
        limits.push({ preload: spNut.limit * spNut.bearingArea, mode: `Surface pressure — nut side (${tappedMaterial.name})` });
      }
    }

    // 4. Thread stripping
    if (assemblyType !== 'through-nut' && tappedMaterial && engagementLength > 0) {
      const ts = calculateThreadStripping(1, screw, tappedMaterial, engagementLength, grade, receiverPreset);
      if (ts.strippingForce > 0 && isFinite(ts.strippingForce)) {
        limits.push({ preload: ts.strippingForce, mode: `Thread stripping (${tappedMaterial.name})` });
      }
    }

    return limits.reduce((min, cur) => cur.preload < min.preload ? cur : min);
  }, [screw, grade, clampedMaterial, tappedMaterial, assemblyType, nut, nutWasher,
      headBearingOD, headBearingID, engagementLength, receiverPreset]);

  // Torque corresponding to 100% assembly capacity
  const fullCapacityTorque = screw
    ? calculateTorque(assemblyCapacity.preload, screw, friction, torqueBearingOD, torqueBearingID) : 0;

  let preload = 0;
  let torque = 0;
  if (screw) {
    if (inputMode === 'utilization' && utilization > 0) {
      torque = (utilization / 100) * fullCapacityTorque;
      preload = calculatePreload(torque, screw, friction, torqueBearingOD, torqueBearingID);
    } else if (inputMode === 'torque' && torqueInput > 0) {
      const m = useImperial ? torqueInput * NM_PER_LBFT : torqueInput;
      torque = m;
      preload = calculatePreload(m, screw, friction, torqueBearingOD, torqueBearingID);
    } else if (inputMode === 'preload' && preloadInput > 0) {
      const m = useImperial ? preloadInput * N_PER_LBF : preloadInput;
      preload = m;
      torque = calculateTorque(m, screw, friction, torqueBearingOD, torqueBearingID);
    }
  }

  const axialServiceLoad = useImperial ? axialLoadInput * N_PER_LBF : axialLoadInput;
  const shearServiceLoad = useImperial ? shearLoadInput * N_PER_LBF : shearLoadInput;

  return {
    assemblyType, setAssemblyType, setScrewOnlyModes,
    inputMode, setInputMode, utilization, setUtilization,
    torqueInput, setTorqueInput, preloadInput, setPreloadInput,
    useImperial, setUseImperial, snapPercent,
    screw, handleScrewChange,
    clampedMaterial, setClampedMaterial, tappedMaterial, setTappedMaterial,
    headWasherIdx, setHeadWasherIdx, nutWasherIdx, setNutWasherIdx,
    nutIdx, setNutIdx, matchingWashers, matchingNuts,
    canUseHeadWasher, headWasher, nutWasher, nut,
    frictionIdx, setFrictionIdx, customFriction, setCustomFriction,
    friction, frictionGroups,
    gradeIdx, setGradeIdx, grade,
    tighteningMethodIdx, setTighteningMethodIdx, tighteningMethod,
    relaxationLossPct, setRelaxationLossPct,
    settlementMicrons, setSettlementMicrons,
    receiverPresetIdx, setReceiverPresetIdx, receiverPreset,
    axialLoadInput, setAxialLoadInput, shearLoadInput, setShearLoadInput,
    slipFriction, setSlipFriction,
    turnedSide, setTurnedSide,         // FIX #2
    interfaceCount, setInterfaceCount, // FIX #5
    engagementLength, setEngagementLength,
    clampLength, setClampLength, clampLengthSplit, setClampLengthSplit,
    preload, torque, axialServiceLoad, shearServiceLoad,
    // Bearing geometry for Results (surface pressure, stiffness)
    headBearingOD, headBearingID,
    nutBearingOD, nutBearingID,
    torqueBearingOD, torqueBearingID,
    assemblyCapacity,
  };
}
