const MILES_TO_KM = 1.60934;

export function formatPace(secondsPerKm) {
  if (!isFinite(secondsPerKm) || secondsPerKm <= 0) return '--:--';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatTime(totalSeconds) {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '--:--:--';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.round(totalSeconds % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function parsePaceInput(mmss) {
  if (!mmss || typeof mmss !== 'string') return null;
  const parts = mmss.trim().split(':');
  if (parts.length !== 2) return null;
  const m = parseInt(parts[0], 10);
  const s = parseInt(parts[1], 10);
  if (isNaN(m) || isNaN(s) || s < 0 || s >= 60 || m < 0) return null;
  return m * 60 + s;
}

function buildSegments(distanceKm, paceSecondsPerKm, unit) {
  const segmentDistKm = unit === 'mile' ? MILES_TO_KM : 1;
  const totalSegments = Math.ceil(distanceKm / segmentDistKm);
  const segments = [];

  for (let i = 0; i < totalSegments; i++) {
    const segStart = i * segmentDistKm;
    const segEnd = Math.min((i + 1) * segmentDistKm, distanceKm);
    const segLengthKm = segEnd - segStart;
    const distanceMarker = unit === 'mile'
      ? parseFloat(((i + 1) * 1).toFixed(2))
      : parseFloat(segEnd.toFixed(2));

    segments.push({
      segment: i + 1,
      distanceMarker,
      paceSeconds: paceSecondsPerKm,
      segmentLengthKm: segLengthKm,
      cumulativeSeconds: 0,
    });
  }
  return segments;
}

export function calcCumulativeTime(segments) {
  let cumulative = 0;
  return segments.map((seg) => {
    cumulative += seg.paceSeconds * seg.segmentLengthKm;
    return { ...seg, cumulativeSeconds: Math.round(cumulative) };
  });
}

export function generateEvenSplits(distanceKm, goalSeconds, unit) {
  const avgPacePerKm = goalSeconds / distanceKm;
  const segments = buildSegments(distanceKm, avgPacePerKm, unit);
  return calcCumulativeTime(segments);
}

export function generateProgressiveSplits(distanceKm, goalSeconds, unit, splitPercent, direction) {
  const avgPacePerKm = goalSeconds / distanceKm;
  const segmentDistKm = unit === 'mile' ? MILES_TO_KM : 1;
  const totalSegments = Math.ceil(distanceKm / segmentDistKm);

  // direction 'negative': runner speeds up (first segment slower, last faster)
  // direction 'positive': runner slows (first segment faster, last slower)
  // half of splitPercent applied to first, inverse to last, linear in between
  const halfDiff = (splitPercent / 100) / 2;

  const segments = [];
  for (let i = 0; i < totalSegments; i++) {
    const t = totalSegments === 1 ? 0 : i / (totalSegments - 1); // 0..1
    let paceMultiplier;
    if (direction === 'negative') {
      // first seg is slower (higher pace), last is faster (lower pace)
      paceMultiplier = 1 + halfDiff - t * 2 * halfDiff;
    } else {
      // positive: first seg is faster (lower pace), last is slower
      paceMultiplier = 1 - halfDiff + t * 2 * halfDiff;
    }

    const segStart = i * segmentDistKm;
    const segEnd = Math.min((i + 1) * segmentDistKm, distanceKm);
    const segLengthKm = segEnd - segStart;
    const distanceMarker = unit === 'mile'
      ? parseFloat(((i + 1) * 1).toFixed(2))
      : parseFloat(segEnd.toFixed(2));

    segments.push({
      segment: i + 1,
      distanceMarker,
      paceSeconds: avgPacePerKm * paceMultiplier,
      segmentLengthKm: segLengthKm,
      cumulativeSeconds: 0,
    });
  }

  // Scale paces so that total time exactly matches goalSeconds
  const rawTotal = segments.reduce((sum, seg) => sum + seg.paceSeconds * seg.segmentLengthKm, 0);
  const scale = goalSeconds / rawTotal;
  const scaled = segments.map((seg) => ({ ...seg, paceSeconds: seg.paceSeconds * scale }));
  return calcCumulativeTime(scaled);
}
