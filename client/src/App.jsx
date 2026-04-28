import React, { useState, useMemo } from 'react';
import RaceSelector from './components/RaceSelector';
import GoalTimeInput from './components/GoalTimeInput';
import SplitModeSelector from './components/SplitModeSelector';
import SplitSlider from './components/SplitSlider';
import CustomPaceTable from './components/CustomPaceTable';
import SplitResultsTable from './components/SplitResultsTable';
import GoalSummary from './components/GoalSummary';
import {
  generateEvenSplits,
  generateProgressiveSplits,
} from './utils/paceCalc';

export default function App() {
  const [selectedRace, setSelectedRace] = useState(null);
  const [goalTime, setGoalTime] = useState({ h: '', m: '', s: '' });
  const [splitMode, setSplitMode] = useState('even');
  const [splitPercent, setSplitPercent] = useState(5);
  const [customPaces, setCustomPaces] = useState([]);

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

        <SplitModeSelector splitMode={splitMode} onChange={(mode) => {
          setSplitMode(mode);
          setCustomPaces([]);
        }} />

        {(splitMode === 'positive' || splitMode === 'negative') && (
          <SplitSlider
            splitMode={splitMode}
            splitPercent={splitPercent}
            onChange={setSplitPercent}
            segments={segments}
            goalSeconds={goalSeconds}
          />
        )}

        {selectedRace && goalSeconds && (
          <GoalSummary
            selectedRace={selectedRace}
            goalSeconds={goalSeconds}
            splitMode={splitMode}
            segments={splitMode !== 'custom' ? segments : []}
          />
        )}

        {splitMode === 'custom' ? (
          <CustomPaceTable
            selectedRace={selectedRace}
            customPaces={customPaces}
            onChange={setCustomPaces}
            goalSeconds={goalSeconds}
          />
        ) : (
          <SplitResultsTable
            segments={segments}
            unit={selectedRace?.unit || 'km'}
            goalSeconds={goalSeconds}
          />
        )}
      </main>
    </div>
  );
}
