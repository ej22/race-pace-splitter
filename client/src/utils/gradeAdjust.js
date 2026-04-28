export function applyGradeAdjustment(segments, elevationProfile, goalSeconds) {
  if (!elevationProfile || elevationProfile.length === 0) return segments;

  const adjusted = segments.map((seg, i) => {
    const elev = elevationProfile[i] || {};
    const gradient = elev.gradientPercent || 0;

    let multiplier;
    if (gradient >= 0) {
      multiplier = 1 + 0.033 * gradient;
    } else if (gradient >= -10) {
      multiplier = 1 - 0.018 * Math.abs(gradient);
    } else {
      // steeper than -10%: benefit caps, cost kicks back in
      multiplier = (1 - 0.018 * 10) + 0.02 * (Math.abs(gradient) - 10);
    }

    return {
      ...seg,
      flatPaceSeconds: seg.paceSeconds,
      adjustedPaceSeconds: seg.paceSeconds * multiplier,
      elevationGain: elev.elevationGain || 0,
      elevationLoss: elev.elevationLoss || 0,
      netChange: elev.netChange ?? 0,
      gradientPercent: gradient,
    };
  });

  // Normalise so total time still equals goalSeconds
  const rawTotal = adjusted.reduce(
    (sum, seg) => sum + seg.adjustedPaceSeconds * seg.segmentLengthKm,
    0
  );
  if (rawTotal === 0) return adjusted;
  const scale = goalSeconds / rawTotal;

  return adjusted.map((seg) => ({
    ...seg,
    adjustedPaceSeconds: seg.adjustedPaceSeconds * scale,
  }));
}
