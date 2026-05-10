import { formatPace } from './paceCalc';

export { formatPace };

export function convertOutdoorToTreadmill(outdoorSpeedKmh) {
  const factor = Math.min(Math.max(1.015 + (outdoorSpeedKmh - 8) * 0.002, 1.015), 1.045);
  return outdoorSpeedKmh * factor;
}

export function speedToPace(speedKmh) {
  if (!speedKmh || speedKmh <= 0) return 0;
  return 3600 / speedKmh;
}

export function paceToSpeed(paceSeconds) {
  if (!paceSeconds || paceSeconds <= 0) return 0;
  return 3600 / paceSeconds;
}

export function generateRangeTable(minSpeed, maxSpeed, stepSize = 0.5) {
  const rows = [];
  const steps = Math.round((maxSpeed - minSpeed) / stepSize);

  for (let i = 0; i <= steps; i++) {
    const speed = Math.round((minSpeed + i * stepSize) * 1000) / 1000;
    const clamped = Math.min(speed, maxSpeed);
    const treadmillSpeed = convertOutdoorToTreadmill(clamped);
    rows.push({
      outdoorSpeed: clamped,
      outdoorPace: speedToPace(clamped),
      treadmillSpeed,
      treadmillPace: speedToPace(treadmillSpeed),
    });
  }

  // Ensure maxSpeed is included
  const last = rows[rows.length - 1];
  if (!last || Math.abs(last.outdoorSpeed - maxSpeed) > 0.001) {
    const treadmillSpeed = convertOutdoorToTreadmill(maxSpeed);
    rows.push({
      outdoorSpeed: maxSpeed,
      outdoorPace: speedToPace(maxSpeed),
      treadmillSpeed,
      treadmillPace: speedToPace(treadmillSpeed),
    });
  }

  return rows;
}
