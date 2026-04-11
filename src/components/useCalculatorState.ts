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

const NM_PER_LBFT = 1.355818;
const N_PER_LBF = 4.44822;

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
    if (!nextScrew.hasHead && assemblyType !== 'tapped-hole') setAssemblyType('tapped-hole');
  }, [assemblyType, clampLength, engagementLength, screw]);

  const snapPercent = (v: number) => Math.max(0, Math.min(100, Math.round(v / 5) * 5));

  const effectiveBearingOD = headWasher ? headWasher.outerDiameter : undefined;
  const effectiveBearingID = headWasher ? headWasher.innerDiameter : undefined;
  const fullProofTorque = screw
    ? calculateTorque(grade.Rp02 * screw.stressArea, screw, friction, effectiveBearingOD, effectiveBearingID) : 0;

  let preload = 0;
  let torque = 0;
  if (screw) {
    if (inputMode === 'utilization' && utilization > 0) {
      torque = (utilization / 100) * fullProofTorque;
      preload = calculatePreload(torque, screw, friction, effectiveBearingOD, effectiveBearingID);
    } else if (inputMode === 'torque' && torqueInput > 0) {
      const m = useImperial ? torqueInput * NM_PER_LBFT : torqueInput;
      torque = m;
      preload = calculatePreload(m, screw, friction, effectiveBearingOD, effectiveBearingID);
    } else if (inputMode === 'preload' && preloadInput > 0) {
      const m = useImperial ? preloadInput * N_PER_LBF : preloadInput;
      preload = m;
      torque = calculateTorque(m, screw, friction, effectiveBearingOD, effectiveBearingID);
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
    engagementLength, setEngagementLength,
    clampLength, setClampLength, clampLengthSplit, setClampLengthSplit,
    preload, torque, axialServiceLoad, shearServiceLoad,
    effectiveBearingOD, effectiveBearingID,
  };
}
