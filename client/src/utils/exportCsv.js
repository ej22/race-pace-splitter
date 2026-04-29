import { formatPace, formatTime } from './paceCalc';

function sanitize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function formatDate(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function downloadCsv(segments, raceInfo, elevationSummary) {
  const { raceName, distanceKm, unit, goalTime, splitMode, avgPace, courseName, raceDate } = raceInfo;
  const hasElevation = elevationSummary != null && segments[0]?.adjustedPaceSeconds != null;
  const paceUnit = unit === 'mile' ? '/mi' : '/km';
  const paceConvert = unit === 'mile' ? 1.60934 : 1;

  const lines = [];
  if (courseName) lines.push(`# Course: ${courseName}`);
  if (raceDate) lines.push(`# Date: ${formatDate(raceDate)}`);
  lines.push(`# Race: ${raceName}`);
  lines.push(`# Distance: ${distanceKm} km`);
  if (goalTime) lines.push(`# Goal Time: ${goalTime}`);
  lines.push(`# Split Mode: ${splitMode}`);
  lines.push(`# Avg Pace: ${avgPace}`);
  if (hasElevation) {
    lines.push(`# Total Ascent: +${elevationSummary.totalAscent}m`);
    lines.push(`# Total Descent: -${elevationSummary.totalDescent}m`);
  }
  lines.push('');

  const headers = ['Segment', 'Distance', `Pace${paceUnit}`, 'Cumulative Time'];
  if (hasElevation) headers.push('Elevation (m)', 'Grade (%)', `Adj Pace${paceUnit}`);
  lines.push(headers.join(','));

  for (const seg of segments) {
    const dist =
      unit === 'mile'
        ? `${seg.distanceMarker.toFixed(1)} mi`
        : `${seg.distanceMarker.toFixed(1)} km`;
    const pace = formatPace(seg.paceSeconds * paceConvert);
    const cum = formatTime(seg.cumulativeSeconds);

    const row = [seg.segment, dist, pace, cum];
    if (hasElevation) {
      const nc = seg.netChange ?? 0;
      row.push(`${nc >= 0 ? '+' : ''}${nc}m`);
      row.push(`${(seg.gradientPercent || 0).toFixed(1)}%`);
      row.push(formatPace(seg.adjustedPaceSeconds * paceConvert));
    }
    lines.push(row.join(','));
  }

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const fileBase = courseName ? sanitize(courseName) : `race-splits-${sanitize(raceName)}`;
  const goalSuffix = goalTime ? `-${sanitize(goalTime)}` : '';
  a.download = `${fileBase}${goalSuffix}.csv`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
