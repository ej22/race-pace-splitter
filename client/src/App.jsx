import React, { useState, useMemo, useRef } from 'react';
import RaceSelector from './components/RaceSelector';
import GoalTimeInput from './components/GoalTimeInput';
import SplitModeSelector from './components/SplitModeSelector';
import SplitSlider from './components/SplitSlider';
import CustomPaceTable from './components/CustomPaceTable';
import SplitResultsTable from './components/SplitResultsTable';
import GoalSummary from './components/GoalSummary';
import GpxUpload from './components/GpxUpload';
import ElevationChart from './components/ElevationChart';
import ExportButtons from './components/ExportButtons';
import {
  generateEvenSplits,
  generateProgressiveSplits,
  parsePaceInput,
  calcCumulativeTime,
  formatPace,
  formatTime,
} from './utils/paceCalc';
import { applyGradeAdjustment } from './utils/gradeAdjust';

const MILES_TO_KM = 1.60934;

export default function App() {
  const [selectedRace, setSelectedRace] = useState(null);
  const [goalTime, setGoalTime] = useState({ h: '', m: '', s: '' });
  const [splitMode, setSplitMode] = useState('even');
  const [splitPercent, setSplitPercent] = useState(5);
  const [customPaces, setCustomPaces] = useState([]);
  const [elevationProfile, setElevationProfile] = useState(null);
  const [elevationSummary, setElevationSummary] = useState(null);
  const [gpxFilename, setGpxFilename] = useState(null);

  const chartRef = useRef(null);

  const goalSeconds = useMemo(() => {
    const h = parseInt(goalTime.h) || 0;
    const m = parseInt(goalTime.m) || 0;
    const s = parseInt(goalTime.s) || 0;
    const total = h * 3600 + m * 60 + s;
    return total > 0 ? total : null;
  }, [goalTime]);

  const segments = useMemo(() => {
    if (!selectedRace || !goalSeconds) return [];
    if (splitMode === 'even') {
      return generateEvenSplits(selectedRace.distanceKm, goalSeconds, selectedRace.unit);
    }
    if (splitMode === 'positive' || splitMode === 'negative') {
      return generateProgressiveSplits(
        selectedRace.distanceKm,
        goalSeconds,
        selectedRace.unit,
        splitPercent,
        splitMode
      );
    }
    return [];
  }, [selectedRace, goalSeconds, splitMode, splitPercent]);

  // Segments with grade adjustment applied (for non-custom modes)
  const adjustedSegments = useMemo(() => {
    if (segments.length === 0 || !elevationProfile || !goalSeconds) return segments;
    return applyGradeAdjustment(segments, elevationProfile, goalSeconds);
  }, [segments, elevationProfile, goalSeconds]);

  // Computed custom segments (for export and GoalSummary in custom mode)
  const customSegments = useMemo(() => {
    if (splitMode !== 'custom' || !selectedRace) return [];
    const segmentDistKm = selectedRace.unit === 'mile' ? MILES_TO_KM : 1;
    const paceConvert = selectedRace.unit === 'mile' ? MILES_TO_KM : 1;
    const totalSegs = Math.ceil(selectedRace.distanceKm / segmentDistKm);

    const segs = Array.from({ length: totalSegs }, (_, i) => {
      const segEnd = Math.min((i + 1) * segmentDistKm, selectedRace.distanceKm);
      const segLengthKm = segEnd - i * segmentDistKm;
      const p = customPaces[i] || '';
      const paceSecondsPerKm = parsePaceInput(p);
      return {
        segment: i + 1,
        distanceMarker:
          selectedRace.unit === 'mile' ? i + 1 : parseFloat(segEnd.toFixed(2)),
        paceSeconds: paceSecondsPerKm != null ? paceSecondsPerKm / paceConvert : null,
        segmentLengthKm: segLengthKm,
        cumulativeSeconds: 0,
      };
    });

    if (!segs.every((s) => s.paceSeconds != null)) return [];
    return calcCumulativeTime(segs);
  }, [selectedRace, splitMode, customPaces]);

  // Segments used for export
  const exportSegments = useMemo(() => {
    if (splitMode === 'custom') return customSegments;
    return adjustedSegments;
  }, [splitMode, customSegments, adjustedSegments]);

  function handleElevationData(profile, summary, filename) {
    setElevationProfile(profile);
    setElevationSummary(summary);
    setGpxFilename(filename);
  }

  function handleElevationClear() {
    setElevationProfile(null);
    setElevationSummary(null);
    setGpxFilename(null);
  }

  const raceInfo = useMemo(() => {
    if (!selectedRace || !goalSeconds) return null;
    const avgPaceKm = goalSeconds / selectedRace.distanceKm;
    const avgPaceDisplay = selectedRace.unit === 'mile' ? avgPaceKm * MILES_TO_KM : avgPaceKm;
    const paceUnit = selectedRace.unit === 'mile' ? '/mi' : '/km';
    return {
      raceName: selectedRace.label,
      distanceKm: selectedRace.distanceKm,
      unit: selectedRace.unit,
      goalTime: formatTime(goalSeconds),
      splitMode,
      splitPercent,
      avgPace: `${formatPace(avgPaceDisplay)}${paceUnit}`,
    };
  }, [selectedRace, goalSeconds, splitMode, splitPercent]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-100">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="text-xl font-black tracking-tight uppercase">
          Race <span className="text-[#F27E00]">Pace</span> Splitter
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <RaceSelector selectedRace={selectedRace} onChange={setSelectedRace} />
          <GoalTimeInput goalTime={goalTime} onChange={setGoalTime} selectedRace={selectedRace} />
        </div>

        <SplitModeSelector
          splitMode={splitMode}
          onChange={(mode) => {
            setSplitMode(mode);
            setCustomPaces([]);
          }}
        />

        {(splitMode === 'positive' || splitMode === 'negative') && (
          <SplitSlider
            splitMode={splitMode}
            splitPercent={splitPercent}
            onChange={setSplitPercent}
            segments={segments}
            goalSeconds={goalSeconds}
          />
        )}

        <GpxUpload
          onElevationData={handleElevationData}
          onClear={handleElevationClear}
          hasData={!!elevationProfile}
          summaryData={elevationSummary}
          filename={gpxFilename}
          unit={selectedRace?.unit || 'km'}
        />

        {selectedRace && goalSeconds && (
          <GoalSummary
            selectedRace={selectedRace}
            goalSeconds={goalSeconds}
            splitMode={splitMode}
            segments={splitMode !== 'custom' ? segments : customSegments}
            elevationSummary={elevationSummary}
          />
        )}

        {elevationProfile && (
          <ElevationChart
            ref={chartRef}
            elevationProfile={elevationProfile}
            unit={selectedRace?.unit || 'km'}
          />
        )}

        {splitMode === 'custom' ? (
          <CustomPaceTable
            selectedRace={selectedRace}
            customPaces={customPaces}
            onChange={setCustomPaces}
            goalSeconds={goalSeconds}
            elevationProfile={elevationProfile}
          />
        ) : (
          <SplitResultsTable
            segments={adjustedSegments}
            unit={selectedRace?.unit || 'km'}
            goalSeconds={goalSeconds}
          />
        )}

        {raceInfo && (
          <ExportButtons
            segments={exportSegments}
            raceInfo={raceInfo}
            elevationSummary={elevationSummary}
            chartRef={chartRef}
          />
        )}
      </main>
    </div>
  );
}
