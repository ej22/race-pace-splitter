import React from 'react';
import { formatPace, formatTime } from '../utils/paceCalc';

export default function SplitResultsTable({ segments, unit, goalSeconds }) {
  if (!segments || segments.length === 0) return null;

  const avgPaceSeconds = segments.length > 0
    ? segments.reduce((sum, s) => sum + s.paceSeconds * s.segmentLengthKm, 0) /
      segments.reduce((sum, s) => sum + s.segmentLengthKm, 0)
    : 0;

  const paceUnit = unit === 'mile' ? '/mi' : '/km';
  const paceConvert = unit === 'mile' ? 1.60934 : 1;

  const totalTime = segments[segments.length - 1].cumulativeSeconds;
  const delta = goalSeconds ? totalTime - goalSeconds : null;

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">Splits</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-700 text-neutral-500 text-xs tracking-widest uppercase">
              <th className="text-left py-2 pr-4">Seg</th>
              <th className="text-left py-2 pr-4">Distance</th>
              <th className="text-right py-2 pr-4">Pace{paceUnit}</th>
              <th className="text-right py-2">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((seg, idx) => {
              const isLast = idx === segments.length - 1;
              const displayPace = seg.paceSeconds * paceConvert;
              const deviation = Math.abs(seg.paceSeconds - avgPaceSeconds);
              const highlight = deviation > 10 && !isLast;

              return (
                <tr
                  key={seg.segment}
                  className={`border-b border-neutral-800 ${isLast ? 'font-bold' : ''} ${highlight ? 'bg-neutral-900' : ''}`}
                >
                  <td className="py-2 pr-4 text-neutral-400">{seg.segment}</td>
                  <td className="py-2 pr-4 text-neutral-300">
                    {unit === 'mile'
                      ? `${(seg.distanceMarker).toFixed(1)} mi`
                      : `${seg.distanceMarker.toFixed(1)} km`}
                  </td>
                  <td className={`py-2 pr-4 text-right font-pace ${highlight ? 'text-yellow-400' : 'text-neutral-200'}`}>
                    {formatPace(displayPace)}
                  </td>
                  <td className="py-2 text-right font-pace text-neutral-200">
                    {formatTime(seg.cumulativeSeconds)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {delta != null && (
        <div className="text-sm pt-1">
          <span className="text-neutral-400">vs goal: </span>
          <span className={`font-pace font-bold ${delta > 1 ? 'text-red-400' : 'text-green-400'}`}>
            {delta > 0 ? '+' : ''}{formatTime(Math.abs(delta))}
          </span>
        </div>
      )}
    </div>
  );
}
