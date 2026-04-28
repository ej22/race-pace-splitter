import React from 'react';
import { parsePaceInput, formatTime, calcCumulativeTime } from '../utils/paceCalc';
import { applyGradeAdjustment } from '../utils/gradeAdjust';

const MILES_TO_KM = 1.60934;

export default function CustomPaceTable({ selectedRace, customPaces, onChange, goalSeconds, elevationProfile }) {
  if (!selectedRace) return null;

  const segmentDistKm = selectedRace.unit === 'mile' ? MILES_TO_KM : 1;
  const totalSegments = Math.ceil(selectedRace.distanceKm / segmentDistKm);
  const paceUnit = selectedRace.unit === 'mile' ? '/mi' : '/km';
  const paceConvert = selectedRace.unit === 'mile' ? MILES_TO_KM : 1;

  const paces = Array.from({ length: totalSegments }, (_, i) => customPaces[i] || '');

  function handleChange(idx, val) {
    const next = [...paces];
    next[idx] = val;
    onChange(next);
  }

  const segments = paces.map((p, i) => {
    const segStart = i * segmentDistKm;
    const segEnd = Math.min((i + 1) * segmentDistKm, selectedRace.distanceKm);
    const segLengthKm = segEnd - segStart;
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

  const allValid = segments.every((s) => s.paceSeconds != null);
  const withCumulative = allValid
    ? calcCumulativeTime(segments.map((s) => ({ ...s })))
    : segments;

  const totalTime = allValid ? withCumulative[withCumulative.length - 1].cumulativeSeconds : null;
  const delta = totalTime != null && goalSeconds ? totalTime - goalSeconds : null;

  const hasElevation = elevationProfile && elevationProfile.length > 0;
  const adjustedSegs =
    hasElevation && allValid && totalTime
      ? applyGradeAdjustment(withCumulative, elevationProfile, totalTime)
      : null;

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">Custom Paces</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-700 text-neutral-500 text-xs tracking-widest uppercase">
              <th className="text-left py-2 pr-4">Seg</th>
              <th className="text-left py-2 pr-4">Distance</th>
              <th className="text-right py-2 pr-4">Pace{paceUnit} (MM:SS)</th>
              {hasElevation && (
                <>
                  <th className="text-right py-2 pr-4">Elev</th>
                  <th className="text-right py-2 pr-4">Grade</th>
                  <th className="text-right py-2 pr-4">Adj Pace{paceUnit}</th>
                </>
              )}
              <th className="text-right py-2">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((seg, idx) => {
              const cumSeg = withCumulative[idx];
              const paceValid = seg.paceSeconds != null;
              const adjSeg = adjustedSegs?.[idx];
              const adjFaster =
                adjSeg != null && adjSeg.adjustedPaceSeconds < seg.paceSeconds;

              const elev = elevationProfile?.[idx];

              return (
                <tr key={seg.segment} className="border-b border-neutral-800">
                  <td className="py-1 pr-4 text-neutral-400">{seg.segment}</td>
                  <td className="py-1 pr-4 text-neutral-300">
                    {selectedRace.unit === 'mile'
                      ? `${seg.distanceMarker.toFixed(1)} mi`
                      : `${seg.distanceMarker.toFixed(1)} km`}
                  </td>
                  <td className="py-1 pr-4 text-right">
                    <input
                      type="text"
                      placeholder="MM:SS"
                      value={paces[idx]}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      className={`w-20 bg-neutral-900 border text-right font-pace text-sm px-2 py-1 focus:outline-none focus:border-[#F27E00] ${
                        paces[idx] && !paceValid
                          ? 'border-red-500 text-red-400'
                          : 'border-neutral-700 text-neutral-200'
                      }`}
                    />
                  </td>
                  {hasElevation && (
                    <>
                      <td className="py-1 pr-4 text-right font-pace text-neutral-400 text-xs">
                        {elev ? `${elev.netChange >= 0 ? '↑' : '↓'}${Math.abs(elev.netChange)}m` : '—'}
                      </td>
                      <td className="py-1 pr-4 text-right font-pace text-neutral-400 text-xs">
                        {elev ? `${(elev.gradientPercent || 0).toFixed(1)}%` : '—'}
                      </td>
                      <td className={`py-1 pr-4 text-right font-pace ${adjSeg ? (adjFaster ? 'text-[#22c55e]' : 'text-[#F27E00]') : 'text-neutral-500'}`}>
                        {adjSeg && paceValid
                          ? adjSeg.adjustedPaceSeconds != null
                            ? `${Math.floor(adjSeg.adjustedPaceSeconds * paceConvert / 60)}:${String(Math.round((adjSeg.adjustedPaceSeconds * paceConvert) % 60)).padStart(2, '0')}`
                            : '—'
                          : '—'}
                      </td>
                    </>
                  )}
                  <td className="py-1 text-right font-pace text-neutral-400">
                    {allValid && cumSeg ? formatTime(cumSeg.cumulativeSeconds) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalTime != null && (
        <div className="text-sm pt-1">
          <span className="text-neutral-400">Total: </span>
          <span className="font-pace text-neutral-100">{formatTime(totalTime)}</span>
          {delta != null && (
            <span className={`ml-3 font-pace font-bold ${delta > 1 ? 'text-red-400' : 'text-green-400'}`}>
              {delta > 0 ? '+' : ''}{formatTime(Math.abs(delta))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
