import React from 'react';
import { formatPace, formatTime } from '../utils/paceCalc';

const MILES_TO_KM = 1.60934;

const MODE_LABELS = {
  even: 'Even',
  positive: 'Positive',
  negative: 'Negative',
  custom: 'Custom',
};

function formatDate(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function GoalSummary({ selectedRace, goalSeconds, splitMode, segments, elevationSummary, courseName, raceDate }) {
  if (!selectedRace || !goalSeconds) return null;

  const avgPaceKm = goalSeconds / selectedRace.distanceKm;
  const avgPaceDisplay = selectedRace.unit === 'mile' ? avgPaceKm * MILES_TO_KM : avgPaceKm;
  const paceUnit = selectedRace.unit === 'mile' ? '/mi' : '/km';

  const projectedTime =
    segments && segments.length > 0 ? segments[segments.length - 1].cumulativeSeconds : null;
  const delta = projectedTime != null ? projectedTime - goalSeconds : null;

  const displayName = courseName || selectedRace.label;
  const formattedDate = formatDate(raceDate);

  return (
    <div className="border border-neutral-800 bg-neutral-900 px-4 py-3 flex flex-wrap gap-6 text-sm">
      <div>
        <div className="text-[10px] tracking-widest text-neutral-500 uppercase mb-0.5">
          {courseName ? 'Course' : 'Race'}
        </div>
        <div className="font-bold text-neutral-100">{displayName}</div>
      </div>
      {formattedDate && (
        <div>
          <div className="text-[10px] tracking-widest text-neutral-500 uppercase mb-0.5">Date</div>
          <div className="font-bold text-neutral-100">{formattedDate}</div>
        </div>
      )}
      <div>
        <div className="text-[10px] tracking-widest text-neutral-500 uppercase mb-0.5">Goal</div>
        <div className="font-pace text-neutral-100">{formatTime(goalSeconds)}</div>
      </div>
      <div>
        <div className="text-[10px] tracking-widest text-neutral-500 uppercase mb-0.5">Avg Pace</div>
        <div className="font-pace text-neutral-100">{formatPace(avgPaceDisplay)}{paceUnit}</div>
      </div>
      <div>
        <div className="text-[10px] tracking-widest text-neutral-500 uppercase mb-0.5">Strategy</div>
        <div className="font-bold text-[#F27E00]">{MODE_LABELS[splitMode]}</div>
      </div>
      {elevationSummary && (
        <>
          <div>
            <div className="text-[10px] tracking-widest text-neutral-500 uppercase mb-0.5">Ascent</div>
            <div className="font-pace text-neutral-100">+{elevationSummary.totalAscent}m</div>
          </div>
          <div>
            <div className="text-[10px] tracking-widest text-neutral-500 uppercase mb-0.5">Descent</div>
            <div className="font-pace text-neutral-100">-{elevationSummary.totalDescent}m</div>
          </div>
        </>
      )}
      {projectedTime != null && (
        <>
          <div>
            <div className="text-[10px] tracking-widest text-neutral-500 uppercase mb-0.5">Projected</div>
            <div className="font-pace text-neutral-100">{formatTime(projectedTime)}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-widest text-neutral-500 uppercase mb-0.5">Delta</div>
            <div className={`font-pace font-bold ${delta > 1 ? 'text-red-400' : 'text-green-400'}`}>
              {delta > 0 ? '+' : ''}{formatTime(Math.abs(delta))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
